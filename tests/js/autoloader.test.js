let hatenabar = null;
let srcPath = 'autoloader-test';
let destPath = '../../chrome/content';
let xulURI = 'chrome://hatenabar/content/autoloader-test.xul';

function loadAutoloader(uri) {
    var global = {
        get window () this,
        location: { href: uri },
        __proto__: window,
    };
    Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
              .getService(Components.interfaces.mozIJSSubScriptLoader)
              .loadSubScript("chrome://hatenabar/content/autoloader.js", global);
    return global;
}

function warmUp() {
    scriptDir = utils.cosmeticClone(srcPath, destPath);
    hatenabar = loadAutoloader(xulURI).hatenabar;
}

function coolDown() {
    utils.scheduleToRemove(baseURL + destPath + '/' + srcPath);
}

function testModuleLoaded() {
    assert.isDefined(hatenabar.Foo);
    assert.equals(hatenabar.Foo.baz, 42);
    assert.equals(hatenabar.Foo.location, location.href);
    assert.isUndefined(hatenabar.Bar);
}
