Components.utils.import('resource://hatenabar/modules/30-Strings.js');

let srcPath = 'Strings.test.properties';
let destPathEn = '../../chrome/locale/en-US';
let destPathJa = '../../chrome/locale/ja';

function warmUp() {
    utils.cosmeticClone(srcPath, destPathEn);
    utils.cosmeticClone(srcPath, destPathJa);
}

function coolDown() {
    utils.scheduleToRemove(baseURL + destPathEn + '/' + srcPath);
    utils.scheduleToRemove(baseURL + destPathJa + '/' + srcPath);
}

function testGet() {
    let uriSpec = baseURL + 'Strings.test.properties';
    let strings = new Strings(uriSpec);
    assert.equals('Hello, world!', strings.get('hello'));
    assert.equals('Hello, Strings world!',
                  strings.get('helloSomething', ['Strings']));
    assert.equals('Hello, Strings world!',
                  strings.get('helloSomething', 'Strings'));
}

function testAbbrevedURL() {
    let strings = new Strings('Strings.test.properties');
    assert.equals('Hello, world!', strings.get('hello'));
}

function testGetChildStrings() {
    let s1 = new Strings('Strings.test.properties', 'foo');
    assert.equals('foo.bar', s1.get('bar'));
    assert.equals('foo.bar.baz', s1.get('bar.baz'));

    let s2 = s1.getChildStrings('bar');
    assert.equals('foo.bar.baz', s2.get('baz'));
}
