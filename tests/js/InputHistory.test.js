var global = this;
var hatenabar;

function warmUp() {
    utils.include('helpers.js');
    hatenabar = loadAutoloader().hatenabar;
    hatenabar.extend(global, hatenabar);
}

function coolDown() {
    let branch = PrefService.getBranch('extensions.hatenabar.inputHistory.keys.');
    try { branch.clearUserPref('test'); } catch (ex) {}
    try { branch.clearUserPref('test2'); } catch (ex) {}
}

function testKey() {
    let hist = new InputHistory('test');

    let key = hist.key;
    assert.isString(key);
    assert.compare(0, '<', key.length);

    let hist2 = new InputHistory('test');
    assert.isTrue(hist.key === hist2.key);

    let hist3 = new InputHistory('test2');
    assert.isFalse(hist.key === hist3.key);
}

function testEntryOperations() {
    let hist = new InputHistory('test');

    assert.isFalse(hist.has('foo'));
    hist.add('foo');
    assert.isTrue(hist.has('foo'));
    hist.add('bar');
    hist.remove('foo');
    assert.isFalse(hist.has('foo'));
    assert.isTrue(hist.has('bar'));
    assert.isTrue(hist.hasAny());
    hist.clear();
    assert.isFalse(hist.has('bar'));
    assert.isFalse(hist.hasAny());
}
