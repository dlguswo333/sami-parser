import {CommentToken, ContentToken, CurlyToken, EndTagToken, Properties, StartTagToken, Token} from './Tokenizer';

export type Node = {
  nodeType: NodeSpecifier;
  tagType?: string;
  children: Node[];
  content?: string;
  properties?: Properties
}

export type NodeSpecifier = 'BracketNode' | 'ContentNode' | 'CommentNode' | 'CurlyNode' | 'RootNode';
export type ParseResult = Node;

const voidTags = ['BR'];

class Parser {
  private tokens: Token[];
  private cursor: number;
  /** Result of parsing. */
  private tree: Node;
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
        if (/^SAMI$/i.test(token.tagType)) {
          if (this.stack.length > 0) {
            throw new Error('Parse error: The root node is not SAMI.');
          }
        } else if (this.doesTagExistInStack(token.tagType.toUpperCase()) &&
          (/^SYNC$/i.test(token.tagType) || /^P$/i.test(token.tagType))) {
          // A node with the same tag type exists in the parent stack,
          // but they are not actually one inside another structure.
          // This is because SAMI blocks may terminate implicitly without a closing tag.
          // Some tags cannot be nested e.g. SYNC, P.
          // Therefore, return to the parent.
          // However, there are some exceptions such as 'font' tags.
          this.stack.pop();
          return;
        } else if (!this.doesTagExistInStack('SAMI')) {
          // Outside of the SAMI node.
          throw new Error(`Parse error: '${token.tagType}' node is outside of SAMI tag.`);
        } else if (/^SYNC$/i.test(token.tagType)) {
          if (!this.doesTagExistInStack('BODY')) {
            throw new Error('Parse error: the parent node of SYNC tag is not BODY.');
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
    // Virtual root node. Needed to permit comment nodes outside of SAMI node.
    this.tree = {nodeType: 'RootNode', children: []};
    this._parse(this.tree);
    if (!this.tree.children.some((node) => node.nodeType === 'BracketNode' && node.tagType === 'SAMI')) {
      throw new Error('Could not parse tokens: Cannot find the root of SAMI.');
    }
    return this.tree;
  }
}

export default Parser;
