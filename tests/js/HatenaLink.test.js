Components.utils.import('resource://hatenabar/modules/00-core.js');
Components.utils.import('resource://hatenabar/modules/10-HatenaLink.js');

function testParse() {
    let o;
    o = HatenaLink.parse('d:id:sample:20100401');
    assert.equals('http://d.hatena.ne.jp/sample/20100401', o.url);
    o = HatenaLink.parse('d:id:?:20100401', { user: 'sample' });
    assert.equals('http://d.hatena.ne.jp/sample/20100401', o.url);
}

function testAntennaLink() {
    let u = method(HatenaLink, 'parseToURL');
    assert.equals('http://a.hatena.ne.jp/', u('a:'));
    assert.equals('http://a.hatena.ne.jp/sample/', u('a:id:sample'));
    assert.equals('http://a.hatena.ne.jp/include?http://example.org/',
                  u('a:include', { url: 'http://example.org/' }));
    assert.equals('http://a.hatena.ne.jp/append?http%3A//example.org/',
                  u('a:append', { url: 'http://example.org/' }));
}

function testBookmarkLink() {
    let u = method(HatenaLink, 'parseToURL');
    assert.equals('http://b.hatena.ne.jp/', u('b:'));
    assert.equals('http://b.hatena.ne.jp/sample/', u('b:id:sample'));
    assert.equals('http://b.hatena.ne.jp/sample/favorite',
                  u('b:id:sample:favorite'));
    assert.equals('http://b.hatena.ne.jp/sample/hatena/',
                  u('b:id:sample:t:hatena'));
    assert.equals('http://b.hatena.ne.jp/t/hatena',
                  u('b:t:hatena'));
    //assert.equals('http://b.hatena.ne.jp/keyword/%E3%81%AF%E3%81%A6%E3%81%AA',
    //              u('b:keyword:はてな'));
    assert.equals('http://b.hatena.ne.jp/entry/example.org/',
                  u('b:entry', { url: 'http://example.org/' }));
    assert.equals('http://b.hatena.ne.jp/entry/example.org/%23fragment',
                  u('b:entry', { url: 'http://example.org/#fragment' }));
    assert.equals('http://b.hatena.ne.jp/entry/s/example.org/',
                  u('b:entry', { url: 'https://example.org/' }));
    assert.equals('http://b.hatena.ne.jp/sample/?mode=detail',
                  u('b:id:sample:detail'));
}

function testDiaryLink() {
    let u = method(HatenaLink, 'parseToURL');
    assert.equals('http://d.hatena.ne.jp/', u('d:'));
    assert.equals('http://d.hatena.ne.jp/sample/', u('d:id:sample'));
    assert.equals('http://d.hatena.ne.jp/sample/20100401',
                  u('d:id:sample:20100401'));
    //assert.equals('http://d.hatena.ne.jp/keyword/%A4%CF%A4%C6%A4%CA',
    //              u('d:keyword:はてな'));
}

function testFotolifeLink() {
    let u = method(HatenaLink, 'parseToURL');
    assert.equals('http://f.hatena.ne.jp/', u('f:'));
    assert.equals('http://f.hatena.ne.jp/sample/', u('f:id:sample'));
    assert.equals('http://f.hatena.ne.jp/sample/favorite',
                  u('f:id:sample:favorite'));
    assert.equals('http://f.hatena.ne.jp/sample/20100401100836',
                  u('f:id:sample:20100401100836j'));
    assert.equals('http://f.hatena.ne.jp/sample/t/hatena',
                  u('f:id:sample:t:hatena'));
    assert.equals('http://f.hatena.ne.jp/t/hatena',
                  u('f:t:hatena'));
}

function testGroupLink() {
    let u = method(HatenaLink, 'parseToURL');
    assert.equals('http://g.hatena.ne.jp/', u('g:'));
    assert.equals('http://g.hatena.ne.jp/sample/', u('g:id:sample'));
    assert.equals('http://hatena.g.hatena.ne.jp/', u('g:hatena'));
    assert.equals('http://hatena.g.hatena.ne.jp/sample/',
                  u('g:hatena:id:sample'));
    assert.equals('http://hatena.g.hatena.ne.jp/sample/20100401',
                  u('g:hatena:id:sample:20100401'));
    //assert.equals('http://hatena.g.hatena.ne.jp/keyword/%E3%81%AF%E3%81%A6%E3%81%AA',
    //              u('g:hatena:keyword:はてな'));
}

function testHaikuLink() {
    let u = method(HatenaLink, 'parseToURL');
    assert.equals('http://h.hatena.ne.jp/', u('h:'));
    assert.equals('http://h.hatena.ne.jp/sample/', u('h:id:sample'));
    //assert.equals('http://h.hatena.ne.jp/keyword/%E3%81%AF%E3%81%A6%E3%81%AA',
    //              u('h:keyword:はてな'));
}

function testIdeaLink() {
    let u = method(HatenaLink, 'parseToURL');
    assert.equals('http://i.hatena.ne.jp/', u('i:'));
    assert.equals('http://i.hatena.ne.jp/sample/', u('i:id:sample'));
    //assert.equals('http://i.hatena.ne.jp/t/%E3%81%AF%E3%81%A6%E3%81%AA',
    //              u('i:t:はてな'));
    assert.equals('http://i.hatena.ne.jp/idea/42', u('idea:42'));
    assert.equals('http://i.hatena.ne.jp/idea/42', u('idea:42:title'));
}

function testKeywordLink() {
    let u = method(HatenaLink, 'parseToURL');
    //assert.equals('http://d.hatena.ne.jp/keyword/%A4%CF%A4%C6%A4%CA',
    //              u('keyword:はてな'));
    assert.equals('http://k.hatena.ne.jp/', u('k:'));
    assert.equals('http://k.hatena.ne.jp/sample/', u('k:id:sample'));
}

function testMessageLink() {
    let u = method(HatenaLink, 'parseToURL');
    assert.equals('http://m.hatena.ne.jp/', u('m:'));
}

function testQuestionLink() {
    let u = method(HatenaLink, 'parseToURL');
    assert.equals('http://q.hatena.ne.jp/', u('q:'));
    assert.equals('http://q.hatena.ne.jp/1234567890',
                  u('question:1234567890'));
    assert.equals('http://q.hatena.ne.jp/1234567890',
                  u('question:1234567890:title'));
    //assert.equals('http://q.hatena.ne.jp/1234567890#eq01',
    //              u('question:1234567890:q1'));
}

function testStarLink() {
    let u = method(HatenaLink, 'parseToURL');
    assert.equals('http://s.hatena.ne.jp/', u('s:'));
}

function testUgomemoLink() {
    let u = method(HatenaLink, 'parseToURL');
    assert.equals('http://ugomemo.hatena.ne.jp/', u('ugomemo:'));
    assert.equals('http://ugomemo.hatena.ne.jp/movies?sort=hot', u('ugomemo:hotmovies'));
}

function testWWWLink() {
    let u = method(HatenaLink, 'parseToURL');
    assert.equals('http://www.hatena.ne.jp/', u('www:'));
    assert.equals('http://www.hatena.ne.jp/my', u('www:my'));
    assert.equals('http://www.hatena.ne.jp/tool/firefox',
                  u('www:tool:firefox'));
}

function testCounterLink() {
    let u = method(HatenaLink, 'parseToURL');
    assert.equals('http://counter.hatena.ne.jp/', u('counter:'));
    assert.equals('http://counter.hatena.ne.jp/sample/', u('counter:id:sample'));
}

function testGraphLink() {
    let u = method(HatenaLink, 'parseToURL');
    assert.equals('http://graph.hatena.ne.jp/', u('graph:'));
    assert.equals('http://graph.hatena.ne.jp/sample/', u('graph:id:sample'));
}
