Components.utils.import('resource://hatenabar/modules/01-Prefs.js');

function setUp() {
    utils.setPref('extensions.hatenabar.strfoo', 'foo');
    utils.setPref('extensions.hatenabar.strbar', 'bar');
    utils.setPref('extensions.hatenabar.intbar', 3);
    utils.setPref('extensions.hatenabar.bar', 'bar');
    utils.setPref('extensions.hatenabar.hogehoge.hugahuga', 100);
    utils.setPref('toplevel.bar', 'foo');
    //Prefs.global.register();
    //Prefs.hatenabar.register();
}

function tearDown() {
    utils.clearPref('extensions.hatenabar.strfoo');
    utils.clearPref('extensions.hatenabar.strbar');
    utils.clearPref('extensions.hatenabar.intbar');
    utils.clearPref('extensions.hatenabar.bar');
    utils.clearPref('extensions.hatenabar.hogehoge.hugahuga');
    utils.clearPref('extensions.hatenabar.setstrbar');
    utils.clearPref('extensions.hatenabar.setbarint');
    //Prefs.global.unregister();
    //Prefs.hatenabar.unregister();
}


function testPref()
{
    assert.equals('foo', Prefs.hatenabar.get('strfoo'));
    assert.equals(3, Prefs.hatenabar.get('intbar'));
    assert.equals('bar', Prefs.hatenabar.get('bar'));

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
}

//function testObserve() {
//    var loaded = { value: false };
//    var loaded2 = { value: false };
//    Prefs.hatenabar.createListener('strfoo', function(e) {
//        loaded.value = true;
//    });
//    Prefs.global.createListener('extensions.hatenabar.strfoo', function(e) {
//        loaded2.value = true;
//    });
//    utils.setPref('extensions.hatenabar.strfoo', 'change');
//    yield loaded;
//    yield loaded2;
//}
