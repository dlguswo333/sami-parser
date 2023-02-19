export abstract class Token {
}

export class TagToken extends Token {
  public tagType: string;
  constructor (tagType: string) {
    super();
    this.tagType = tagType;
  }
}

export class StartTagToken extends TagToken {
  public properties: Properties;
  constructor (tagType: string, properties: Properties) {
    super(tagType);
    this.properties = properties;
  }
}

export class EndTagToken extends TagToken {
  constructor (tagType: string) {
    super(tagType);
  }
}

export class ContentToken extends Token {
  public content: string;
  constructor (content: string) {
    super();
    this.content = content;
  }
}

export class CommentToken extends Token {
  public content: string;
  constructor (content: string) {
    super();
    this.content = content;
  }
}

export class CurlyToken extends TagToken {
  public content: string;
  constructor (tagType: string, content: string) {
    super(tagType);
    this.content = content;
  }
}

export type TokenSpecifier = 'StartTagToken' | 'EndTagToken' | 'ContentToken' | 'CommentToken' | 'CurlyToken';
export type Properties = Record<string, number | string>;

const rules: [RegExp, TokenSpecifier][] = [
  [/^[\s]*<([\w][^>]*)>/, 'StartTagToken'],
  [/^[\s]*<\/([^>]+)>/, 'EndTagToken'],
  [/^[\s]*<!--([\S\s]*?)-->/, 'CommentToken'],
  [/^[\s]*[#.]?\w+[\s]*\{[^}]*\}/, 'CurlyToken'],
  [/^[^<>]*/, 'ContentToken'],
];

class Tokenizer {
  public tokenize (code: string): Token[] {
    const tokens: Token[] = [];
    // Trim the code before tokenizing to prevent
    // ContentToken of newlines or whitespaces outside root <SAMI> tag.
    code = code.trim();
    while (code) {
      let tokenized = false;
      for (const [regex, specifier] of rules) {
        const regexResult = regex.exec(code);
        if (regexResult === null) {
          continue;
        }
        tokenized = true;
        switch (specifier) {
          case 'StartTagToken': {
            const innerContent = regexResult[1];
            tokens.push(this.parseStartTagContent(innerContent));
            break;
          }
          case 'EndTagToken': {
            const innerContent = regexResult[1];
            tokens.push(this.parseEndTagContent(innerContent));
            break;
          }
          case 'ContentToken': {
            const innerContent = regexResult[0];
            tokens.push(this.parseContentTagContent(innerContent));
            break;
          }
          case 'CurlyToken': {
            const innerContent = regexResult[0];
            tokens.push(this.parseCurlyTagContent(innerContent));
            break;
          }
          case 'CommentToken': {
            const innerContent = regexResult[1];
            tokens.push(this.parseCommentTagContent(innerContent));
            break;
          }
          default: {
            throw new Error('Not yet implemented');
          }
        }
        if (tokenized) {
          if (regexResult[0].length === 0) {
            throw new Error('Possible infinite loop detected: ' + code.slice(0, 15));
          }
          code = code.slice(regexResult[0].length);
          break;
        }
      }
      if (!tokenized) {
        throw new Error('Invalid SAMI Format: ' + code.slice(0, 15));
      }
    }
    return tokens;
  }

  public parseStartTagContent (content: string) {
    content = content.trim();
    const wholeRegex = /^(\w+)((?:[\s]+(?:\w+=(?:"?[^"=]*"?|\d+)))*)$/;
    const propertyRegex = /(\w+)=("[^"]*"|\w+|\d+)/g;
    const result = wholeRegex.exec(content);
    if (result === null) {
      throw new Error('Invalid Tag Error: ' + content);
    }
    const tagType = result[1];
    const properties = {};
    if (!result[2]) {
      return new StartTagToken(tagType, properties);
    }

    for (const propMatch of [...result[2].matchAll(propertyRegex)]) {
      let propValue: string|number;
      const propKey = propMatch[1];
      if (propMatch[2].match(/^\d+$/)) {
        // Resolve to number type.
        propValue = Number(propMatch[2]);
      } else {
        // Unwrap double quotes.
        propValue = propMatch[2].match(/"[^"]*"/)
          ? propMatch[2].slice(1, propMatch[2].length - 1)
          : propMatch[2];
      }
      properties[propKey] = propValue;
    }
    return new StartTagToken(tagType.toString(), properties);
  }

  public parseEndTagContent (content: string) {
    content = content.trim();
    const regex = /^(\w+)$/;
    const result = regex.exec(content);
    if (result === null) {
      throw new Error('Invalid Tag Error: ' + content);
    }
    const tagType = result[1];
    return new EndTagToken(tagType);
  }

  public parseContentTagContent (content: string) {
    return new ContentToken(content);
  }

  // TODO: Implement parsing inner content.
  public parseCurlyTagContent (content: string) {
    content = content.trim();
    const regex = /^([#.]?\w+)[\s]*\{([^}]*)\}/;
    const result = regex.exec(content);
    if (result === null) {
      throw new Error('Invalid Tag Error: ' + content);
    }
    const tagType = result[1];
    const innerContent = result[2];
    return new CurlyToken(tagType, innerContent);
  }

  public parseCommentTagContent (content: string) {
    return new CommentToken(content);
  }
}

export default Tokenizer;
