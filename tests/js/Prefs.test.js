Components.utils.import('resource://hatenabar/modules/00-core.js');
Components.utils.import('resource://hatenabar/modules/03-Prefs.js');

function setUp() {
    utils.setPref('extensions.hatenabar.strfoo', 'foo');
    utils.setPref('extensions.hatenabar.strbar', 'bar');
    utils.setPref('extensions.hatenabar.intbar', 3);
    utils.setPref('extensions.hatenabar.strja', '日本語');
    utils.setPref('extensions.hatenabar.bar', 'bar');
    utils.setPref('extensions.hatenabar.json.foo', '{"foo":42,"bar":23}');
    utils.setPref('extensions.hatenabar.json.bar', '');
    utils.setPref('extensions.hatenabar.hogehoge.hugahuga', 100);
    utils.setPref('toplevel.bar', 'foo');
    //Prefs.global.register();
    //Prefs.hatenabar.register();
}

function tearDown() {
    Prefs.hatenabar.clear('setstrbar');
    Prefs.hatenabar.clear('setbarint');
    Prefs.hatenabar.clear('strfoo');
}


function testPref() {
    assert.equals('foo', Prefs.hatenabar.get('strfoo'));
    assert.equals(3, Prefs.hatenabar.get('intbar'));
    assert.equals('bar', Prefs.hatenabar.get('bar'));
    assert.equals('日本語', Prefs.hatenabar.get('strja'));
    assert.equals('日本語', Prefs.hatenabar.get('strja', '', Ci.nsIPrefLocalizedString));

    Prefs.hatenabar.set('setstrbar', 'string');
    assert.equals(utils.getPref('extensions.hatenabar.setstrbar'), 'string');
    utils.clearPref('extensions.hatenabar.setstrbar');

    Prefs.hatenabar.set('setbarint', 4);
    assert.equals(utils.getPref('extensions.hatenabar.setbarint'), 4);
    utils.clearPref('extensions.hatenabar.setbarint');

    Prefs.global.clear('toplevel.bar');
    let status = 'PASS';
    try { Prefs.global.get('toplevel.bar'); }
    catch (ex) { status = 'THROWN'; }
    assert.equals('THROWN', status, 'Throw for not existing prefs.');

    assert.equals(42, Prefs.global.get('toplevel.bar', 42));

    assert.equals({ foo: 42, bar: 23 },
                  Prefs.hatenabar.get('json.foo', null, JSON));
    Prefs.hatenabar.set('json.bar', [42, 23], JSON);
    assert.equals('[42,23]', utils.getPref('extensions.hatenabar.json.bar'));
}

function testGetChildPrefs() {
    let prefs = Prefs.hatenabar.getChildPrefs('testChild.');
    assert.isTrue(prefs instanceof Prefs);
    assert.equals('extensions.hatenabar.testChild.', prefs.branch);
    assert.equals(42, prefs.get('testName', 42));
    let prefs2 = Prefs.hatenabar.getChildPrefs('testChild');
    assert.equals('extensions.hatenabar.testChild.', prefs2.branch);
}

function testObserve() {
    let loaded = { value: false };
    let loaded2 = { value: false };
    let b1, b2;
    Prefs.hatenabar.createListener('strfoo', function () {
        b1 = this.target.branch;
        loaded.value = true;
    });
    Prefs.global.createListener('extensions.hatenabar.strfoo', function () {
        b2 = this.target.branch;
        loaded2.value = true;
    });
    utils.setPref('extensions.hatenabar.strfoo', 'change');
    yield loaded;
    yield loaded2;
    assert.equals('extensions.hatenabar.', b1);
    assert.equals('', b2);
}
