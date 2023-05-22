import Tokenizer, {ContentToken, EndTagToken, StartTagToken} from '../src/Tokenizer';
import * as assert from 'node:assert';

const tokenizer = new Tokenizer();

describe('Test basic tokenizer features', () => {
  it('Parse start tag', () => {
    let result = tokenizer.parseStartTagContent('STYLE TYPE="text/css"');
    assert.deepStrictEqual(result.tagType, 'STYLE');
    assert.deepStrictEqual(result.properties['TYPE'], 'text/css');

    result = tokenizer.parseStartTagContent('SYNC START=1000');
    assert.deepStrictEqual(result.tagType, 'SYNC');
    assert.deepStrictEqual(result.properties['START'], 1000);

    result = tokenizer.parseStartTagContent('TITLE');
    assert.deepStrictEqual(result.tagType, 'TITLE');

    result = tokenizer.parseStartTagContent('P Class=FRFRCC');
    assert.deepStrictEqual(result.tagType, 'P');
    assert.deepStrictEqual(result.properties['Class'], 'FRFRCC');

    result = tokenizer.parseStartTagContent('P Class=FRFRCC ID=Source');
    assert.deepStrictEqual(result.tagType, 'P');
    assert.deepStrictEqual(result.properties['Class'], 'FRFRCC');
    assert.deepStrictEqual(result.properties['ID'], 'Source');

    result = tokenizer.parseStartTagContent('P  ID=Source   Class=FRFRCC ');
    assert.deepStrictEqual(result.tagType, 'P');
    assert.deepStrictEqual(result.properties['Class'], 'FRFRCC');
    assert.deepStrictEqual(result.properties['ID'], 'Source');

    result = tokenizer.parseStartTagContent('FONT color="#3f3f3f"');
    assert.deepStrictEqual(result.tagType, 'FONT');
    assert.deepStrictEqual(result.properties['color'], '#3f3f3f');

    result = tokenizer.parseStartTagContent('FONT color=#ffffff');
    assert.deepStrictEqual(result.tagType, 'FONT');
    assert.deepStrictEqual(result.properties['color'], '#ffffff');

    result = tokenizer.parseStartTagContent('FONT color = #ffffff');
    assert.deepStrictEqual(result.tagType, 'FONT');
    assert.deepStrictEqual(result.properties['color'], '#ffffff');

    // TODO: Fix unwanted type conversion: '000000' to 0
    // result = tokenizer.parseStartTagContent('FONT color=000000');
    // assert.deepStrictEqual(result.tagType, 'FONT');
    // assert.deepStrictEqual(result.properties['color'], '000000');
  });

  it('Parse end tag', () => {
    let result = tokenizer.parseEndTagContent('STYLE');
    assert.deepStrictEqual(result.tagType, 'STYLE');

    result = tokenizer.parseEndTagContent('TITLE');
    assert.deepStrictEqual(result.tagType, 'TITLE');

    result = tokenizer.parseEndTagContent(' TITLE  ');
    assert.deepStrictEqual(result.tagType, 'TITLE');
  });

  it('Parse curly tag-0', () => {
    const result = tokenizer.parseCurlyTagContent('P {margin-left: 7pt;}');
    assert.deepStrictEqual(result.tagType, 'P');
    assert.deepStrictEqual(result.content, 'margin-left: 7pt;');
  });

  it('Parse curly tag-1', () => {
    const result = tokenizer.parseCurlyTagContent('TABLE { Width: "190pt";  Bacground-color: black;}');
    assert.deepStrictEqual(result.tagType, 'TABLE');
    assert.deepStrictEqual(result.content, ' Width: "190pt";  Bacground-color: black;');
  });

  it('Parse curly tag-2', () => {
    const result = tokenizer.parseCurlyTagContent('.ENUSCC { Width: "190pt";  Bacground-color: black;}');
    assert.deepStrictEqual(result.tagType, '.ENUSCC');
    assert.deepStrictEqual(result.content, ' Width: "190pt";  Bacground-color: black;');
  });

  it('Parse curly tag-3', () => {
    const result = tokenizer.parseCurlyTagContent('#Standard { Width: "190pt";  Bacground-color: black;}');
    assert.deepStrictEqual(result.tagType, '#Standard');
    assert.deepStrictEqual(result.content, ' Width: "190pt";  Bacground-color: black;');
  });

  it('Parse content tag', () => {
    const result = tokenizer.parseContentTagContent(' Hello ');
    assert.deepStrictEqual(result.content, ' Hello ');
  });

  it('Parse comment tag-0', () => {
    const result = tokenizer.parseCommentTagContent(' Hello ');
    assert.deepStrictEqual(result.content, ' Hello ');
  });

  it('Parse comment tag-1', () => {
    const result = tokenizer.parseCommentTagContent('&quot;fqfq한국어漢字&quot;');
    assert.deepStrictEqual(result.content, '&quot;fqfq한국어漢字&quot;');
  });
});

describe('Test tokenizer', () => {
  it('Parse a few tags-0', () => {
    const result = tokenizer.tokenize('<SYNC START=1000>Hello<P Class=FRFRCC>World</P>');
    assert.deepStrictEqual(result.length, 5);
    assert.deepStrictEqual(result[0] instanceof StartTagToken, true);
    assert.deepStrictEqual(result[1] instanceof ContentToken, true);
    assert.deepStrictEqual((result[1] as ContentToken).content, 'Hello');
    assert.deepStrictEqual(result[2] instanceof StartTagToken, true);
    assert.deepStrictEqual(result[3] instanceof ContentToken, true);
    assert.deepStrictEqual(result[4] instanceof EndTagToken, true);
  });

  it('Parse a few tags-1', () => {
    const result = tokenizer.tokenize('<SYNC START=1000><P Class=FRFRCC> World </P>');
    assert.deepStrictEqual(result.length, 4);
    assert.deepStrictEqual(result[0] instanceof StartTagToken, true);
    assert.deepStrictEqual(result[1] instanceof StartTagToken, true);
    assert.deepStrictEqual(result[2] instanceof ContentToken, true);
    assert.deepStrictEqual((result[2] as ContentToken).content, ' World ');
    assert.deepStrictEqual(result[3] instanceof EndTagToken, true);
  });

  it('Parse a few tags-2', () => {
    const result = tokenizer.tokenize('The <U>rain</U> in <I><B>Spain</B> stays mainly</I>');
    assert.deepStrictEqual(result.length, 11);
    assert.deepStrictEqual(result[0] instanceof ContentToken, true);
    assert.deepStrictEqual(result[1] instanceof StartTagToken, true);
    assert.deepStrictEqual((result[1] as StartTagToken).tagType, 'U');
    assert.deepStrictEqual(result[2] instanceof ContentToken, true);
    assert.deepStrictEqual(result[3] instanceof EndTagToken, true);
    assert.deepStrictEqual((result[3] as EndTagToken).tagType, 'U');
    assert.deepStrictEqual(result[7] instanceof ContentToken, true);
    assert.deepStrictEqual((result[7] as ContentToken).content, 'Spain');
    assert.deepStrictEqual(result[10] instanceof EndTagToken, true);
    assert.deepStrictEqual((result[10] as EndTagToken).tagType, 'I');
  });

  it('Parse a few tags-3', () => {
    // https://learn.microsoft.com/en-us/previous-versions/windows/desktop/dnacc/understanding-sami-1.0#showcases-and-a-sami-document-sample
    const result = tokenizer.tokenize(`
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
    assert.deepStrictEqual(result[0] instanceof StartTagToken, true);
    assert.deepStrictEqual((result[0] as StartTagToken).tagType, 'SAMI');
    assert.deepStrictEqual(result[result.length - 1] instanceof EndTagToken, true);
    assert.deepStrictEqual((result[result.length - 1] as EndTagToken).tagType, 'SAMI');
  });
});
