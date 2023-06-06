import Tokenizer from '../src/Tokenizer';
import Parser from '../src/Parser';
import * as assert from 'node:assert';

describe('Test basic parser features', () => {
  const tokenizer = new Tokenizer();
  const parser = new Parser();

  it('Throw if some node is outside of SAMI node', () => {
    const tokens = tokenizer.tokenize(`
      <!-- This comment is not the root of throws -->
      <Title>Title of SAMI</Title>
      <SAMI>
      </SAMI>
    `);
    assert.throws(() => parser.parse(tokens));
  });

  it('Throw if SAMI node does not exist', () => {
    const tokens = tokenizer.tokenize(`
      <!-- This comment is not the root of throws -->
    `);
    assert.throws(() => parser.parse(tokens));
  });

  it('Throw if more than one BODY node exist', () => {
    const tokens = tokenizer.tokenize(`
      <SAMI>
        <BODY>
          <SYNC start=0>Body tag 1
        </BODY>
        <BODY>
          <SYNC start=0>Body tag 2
        </BODY>
      </SAMI>
    `);
    assert.throws(() => parser.parse(tokens));
  });

  it('Parse a few tags', () => {
    const tokens = tokenizer.tokenize(`
    <SAMI>
      <Head>
        <Title>President John F. Kennedy Speech</Title>
        <SAMIParam>
            Copyright {(C)Copyright 1997, Microsoft Corporation}
            Media {JF Kennedy.wav}
            Metrics {time:ms; duration: 73000;}
            Spec {MSFT:1.0;}
        </SAMIParam>

        <STYLE TYPE="text/css"><!--
            P {margin-left: 29pt; margin-right: 29pt; font-size: 12pt;
            text-align: left; font-family: tahoma, arial, sans-serif;
            font-weight: normal; color: white; background-color: black;}

            TABLE {Width: "248pt" ;}

            .ENUSCC {Name: "English Captions"; lang: en-US-CC;}

      #Source {margin-bottom: -15pt; background-color: silver;
              color: black; vertical-align: normal; font-size: 12pt;
              font-family: tahoma, arial, sans-serif;
              font-weight: normal;}

      #Youth {color: greenyellow; font-size: 18pt;}

      #BigPrint-1 {color: yellow; font-size: 24pt;}-->
        </Style>
      </Head>

      <Body>
        <SYNC Start=0>
            <P Class=ENUSCC ID=Source>Pres. John F. Kennedy
        <SYNC Start=10>
            <P Class=ENUSCC>Let the word go forth,
              from this time and place to friend and foe
              alike that the torch
        <SYNC Start=8800>
            <P Class=ENUSCC>has been passed to a new generation of Americans,
              born in this century, tempered by war,
        <SYNC Start=19500>
            <P Class=ENUSCC>disciplined by a hard and bitter peace,
              proud of our ancient heritage, and unwilling to witness
        <SYNC Start=28000>
            <P Class=ENUSCC>or permit the slow undoing of those human rights
                to which this nation has always
        <SYNC Start=38000>
            <P Class=ENUSCC>been committed and to which we are
              committed today at home and around the world.
        <SYNC Start=46000>
            <P Class=ENUSCC>Let every nation know,
              whether it wishes us well or ill,
              that we shall pay any price, bear any burden,
        <SYNC Start=61000>
            <P Class=ENUSCC>meet any hardship, support any friend,
              oppose any foe, to ensure the survival and
              success of liberty.
        <SYNC Start=73000>
            <P Class=ENUSCC ID=Source>End of:
            <P Class=ENUSCC>President John F. Kennedy Speech
      </Body>
    </SAMI>
    `);
    const parseResult = parser.parse(tokens);
    const bodyTag = parseResult.body;
    assert.strictEqual(!!bodyTag, true);
    assert.strictEqual(bodyTag.tagType, 'BODY');
    assert.strictEqual(bodyTag.nodeType === 'BracketNode', true);
    const isEveryChildOfBodySyncTag = bodyTag?.children.every(node => node.tagType === 'SYNC');
    assert.strictEqual(isEveryChildOfBodySyncTag, true);
  });

  it('Parse a SAMI string', () => {
    const parseResult = parser.parse(`
      <!-- This comment is not the root of throws -->
      <SAMI>
      <Title>Title of SAMI</Title>
        <Body>
          <SYNC START=1000>Hello</SYNC>
          <SYNC START=2000>World</SYNC>
        </Body>
      </SAMI>
    `);
    assert.strictEqual(!!parseResult.root, true);
    assert.strictEqual(!!parseResult.body, true);
    assert.strictEqual(parseResult.body.children.length, 2);
    assert.strictEqual(parseResult.body.children[0].properties && parseResult.body.children[0].properties['START'] === 1000, true);
    assert.strictEqual(parseResult.body.children[1].properties && parseResult.body.children[1].properties['START'] === 2000, true);

  });
});
