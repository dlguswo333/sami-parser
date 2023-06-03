import {CommentToken, ContentToken, CurlyToken, EndTagToken, Properties, StartTagToken, Token} from './Tokenizer';

export type Node = {
  nodeType: NodeSpecifier;
  /** tag type in upper case (e.g. 'SYNC') */
  tagType?: string;
  children: Node[];
  content?: string;
  properties?: Properties
}

export type NodeSpecifier = 'BracketNode' | 'ContentNode' | 'CommentNode' | 'CurlyNode' | 'RootNode';
export type ParseResult = {
  root: Node;
  body: Node;
};

const voidTags = ['BR'];
const regexes = {
  SAMI: /^SAMI$/i,
  SYNC: /^SYNC$/i,
  P: /^P$/i,
};

class Parser {
  private tokens: Token[];
  private cursor: number;
  /** Result of parsing. */
  private tree: Node;
  /** Result body node. */
  private bodyNode: Node;
  /** Used to record whether certain SAMI rules are met. */
  private rules = {
    bodyTagAppeared: false,
  };
  /**
   * Stack of current tag. Used to check grammar.
   * Push upper case letters only for convenience.
   */
  private stack: string[];

  constructor () {
    this.stack = [];
  }

  private pushTokenToStack (token: StartTagToken) {
    this.stack.push(token.tagType.toUpperCase());
  }

  private doesTagExistInStack (tagType: string) {
    return this.stack.some((tag) => tag === tagType);
  }

  private isVoidTag (token: StartTagToken) {
    return voidTags.includes(token.tagType.toUpperCase());
  }

  private _parse (parentNode: Node) {
    let curNode: Node | undefined = undefined;
    while (this.cursor < this.tokens.length) {
      const token = this.tokens[this.cursor];
      if (token instanceof StartTagToken) {
        if (regexes.SAMI.test(token.tagType)) {
          if (this.stack.length > 0) {
            throw new Error('Parse error: The root node is not SAMI.');
          }
        } else if (token.tagType === 'BODY') {
          if (this.rules.bodyTagAppeared) {
            throw new Error('Parse error: More than one BODY tag inside SAMI.');
          }
          this.rules.bodyTagAppeared = true;
        } else if (this.doesTagExistInStack(token.tagType.toUpperCase()) &&
          (regexes.SYNC.test(token.tagType) || regexes.P.test(token.tagType))) {
          // A node with the same tag type exists in the parent stack,
          // but they are not actually one inside another structure.
          // This is because SAMI blocks may terminate implicitly without a closing tag.
          // Such tags are SYNC, P.
          // However, there are more tags that can be nested such as 'font' tags.
          // Thus test if the tag is 'cannot be nested' tag and return to the parent.
          this.stack.pop();
          return;
        } else if (!this.doesTagExistInStack('SAMI')) {
          // Outside of the SAMI tag.
          throw new Error(`Parse error: '${token.tagType}' tag is outside of SAMI tag.`);
        } else if (regexes.SYNC.test(token.tagType)) {
          if (!this.doesTagExistInStack('BODY')) {
            // Outside of the BODY tag.
            throw new Error('Parse error: SYNC tag is outside of the BODY tag.');
          }
        }
        curNode = {
          nodeType: 'BracketNode',
          tagType: token.tagType.toUpperCase(),
          children: [],
          properties: token.properties,
        };
        parentNode.children.push(curNode);
        ++this.cursor;
        if (token.tagType === 'BODY') {
          this.bodyNode = curNode;
        }
        if (!this.isVoidTag(token)) {
          this.pushTokenToStack(token);
          this._parse(curNode);
        }
      } else if (token instanceof EndTagToken) {
        if (!this.doesTagExistInStack(token.tagType.toUpperCase())) {
          throw new Error(`Parse error: Close tag detected that was never open: '${token.tagType}'`);
        }
        if (parentNode.tagType !== token.tagType.toUpperCase()) {
          // Return to the parent node.
          this.stack.pop();
          return;
        }
        // Return to the parent.
        ++this.cursor;
        this.stack.pop();
        return;
      } else if (token instanceof ContentToken) {
        if (parentNode === undefined) {
          throw new Error('Parse error: Content outside root node.');
        }
        parentNode.children.push({
          nodeType: 'ContentNode',
          content: token.content,
          children: [],
        });
        ++this.cursor;
      } else if (token instanceof CommentToken) {
        parentNode.children.push({
          nodeType: 'CommentNode',
          content: token.content,
          children: [],
        });
        ++this.cursor;
      } else if (token instanceof CurlyToken) {
        parentNode.children.push({
          nodeType: 'CurlyNode',
          tagType: token.tagType,
          content: token.content,
          children: [],
        });
        ++this.cursor;
      } else {
        throw new Error('Parse error: Unknown token type.');
      }
    }
  }

  public parse (tokens: Token[]): ParseResult {
    this.tokens = tokens;
    this.cursor = 0;
    // Virtual root node. Needed to keep track of comment nodes outside of SAMI node.
    this.tree = {nodeType: 'RootNode', children: []};
    for (const key of Object.keys(this.rules)) {
      this.rules[key] = false;
    }
    this.stack = [];
    this._parse(this.tree);
    if (!this.tree.children.some((node) => node.nodeType === 'BracketNode' && node.tagType === 'SAMI')) {
      throw new Error('Could not parse tokens: Cannot find the root of SAMI.');
    }
    return {
      root: this.tree,
      body: this.bodyNode,
    };
  }
}

export default Parser;
