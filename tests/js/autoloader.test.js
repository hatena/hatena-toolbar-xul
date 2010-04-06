let hatenabar = null;
let srcPath = 'autoloader-test';
let destPath = '../../chrome/content';
let xulURI = 'chrome://hatenabar/content/autoloader-test.xul';

function warmUp() {
    utils.include('helpers.js');
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
