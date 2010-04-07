var global = this;
var hatenabar;

function warmUp() {
    utils.include('helpers.js');
    hatenabar = loadAutoloader().hatenabar;
    hatenabar.extend(global, hatenabar);
}

function testExpand() {
    assert.equals('http://www.hatena.ne.jp/',
                  HatenaLink.expand('www:'));
    assert.equals('http://www.hatena.ne.jp/my',
                  HatenaLink.expand('www:my'));
    assert.equals('http://b.hatena.ne.jp/',
                  HatenaLink.expand('b:'));
}

function testIsUserRequired() {
    assert.isTrue(HatenaLink.isUserRequired('b:id:$'));
    assert.isTrue(HatenaLink.isUserRequired('www:my'));
    assert.isFalse(HatenaLink.isUserRequired('www:'));
}
