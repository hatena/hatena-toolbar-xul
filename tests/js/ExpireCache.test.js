Components.utils.import('resource://hatenabar/modules/20-ExpireCache.js');

function warmUp() {
    HTTPCache.counter = HTTPCache.bookmarked;
}

function setUp() {
    let filter = "['\\^https:\\/\\/.*\\$', '\\^https?:\\/\\/192\\\\.168\\\\.\\\\d+\\\\.\\\\d+.*\\$', '\\^https?:\\/\\/172\\\\.((1[6-9])|(2[0-9])|(3[0-1]))\\\\.\\\\d+\\\\.\\\\d+.*\\$', '\\^https?:\\/\\/10\\\\.\\\\d+\\\\.\\\\d+\\\\.\\\\d+.*\\$']";
    HTTPCache.counter.setFilter(eval(filter));
}

function testHTTPCounter() {
    let got = {};
    let result;

    got.value = false;
    result = NaN;
    HTTPCache.counter.get('http://www.hatena.ne.jp/my', function (val) {
        result = val;
        got.value = true;
    });
    yield got;
    assert.compare(10, '<', result);

    assert.isTrue(HTTPCache.counter.has('http://www.hatena.ne.jp/my'));
    
    got.value = false;
    result = NaN;
    HTTPCache.counter.get('http://www.hatena.ne.jp/my', function (val) {
        result = val;
        got.value = true;
    });
    yield got;
    assert.compare(10, '<', result);
}

function testHTTPSCounter() {
    let c = HTTPCache.counter;

    assert.isFalse(c.isValid('https://example.com/'));
    assert.isTrue(c.isValid('http://example.com/'));
}

function testLocalURLS() {
    let c = HTTPCache.counter;
    assert.isFalse(c.isValid('http://10.3.2.2/hogehuga?foo=bar'));
    assert.isFalse(c.isValid('https://10.3.2.2/hogehuga?foo=bar'));
    assert.isFalse(c.isValid('http://192.168.3.22/'));
    assert.isFalse(c.isValid('https://192.168.3.22/'));
    assert.isFalse(c.isValid('http://192.168.255.200/hogehuga?foo=bar'));
    assert.isTrue(c.isValid('http://10.example.com/hogehuga?foo=bar'));
    assert.isTrue(c.isValid('http://172.168.3.22/'));
    assert.isFalse(c.isValid('http://172.16.3.22/'));
    assert.isFalse(c.isValid('http://172.16.3.22/foobar?baz'));
    assert.isFalse(c.isValid('http://172.22.3.22/'));
    assert.isFalse(c.isValid('http://172.31.3.22/'));
    assert.isFalse(c.isValid('https://172.31.3.22/'));
    assert.isTrue(c.isValid('http://172.32.3.22/'));
}

function testReferredCounter() {
    let got = {};
    let result;

    got.value = false;
    result = undefined;
    HTTPCache.referred.get('http://www.hatena.ne.jp/', function (val) {
        result = val;
        got.value = true;
    });
    yield got;
    assert.compare(1000, '<', +result.count.(@name == 'diary'));

    assert.isTrue(HTTPCache.referred.has('http://www.hatena.ne.jp/'));
    
    got.value = false;
    result = undefined;
    HTTPCache.referred.get('http://www.hatena.ne.jp/', function (val) {
        result = val;
        got.value = true;
    });
    yield got;
    assert.equals('1', result.count.(@name == 'antenna').toString());
}
