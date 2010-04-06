const MODULE = "resource://hatenabar/modules/00-core.js";

var modules = [
    { path: '../../resources/modules/01-Foo.js',
      content: <![CDATA[
          const EXPORTED_SYMBOLS = ["Foo"];
          var Foo = { baz: 42 };
          var Bar = { baz: 12 };
      ]]>.toString() },

    { path: '../../resources/modules/02-Hoge.js',
      content: <![CDATA[
          Components.utils.import('resource://hatenabar/modules/00-core.js');
          loadPrecedingModules();
          const EXPORTED_SYMBOLS = ["Hoge"];
          var Hoge = { piyo: Foo.baz };
      ]]>.toString() },
];

function warmUp() {
    Components.utils.import(MODULE);
    modules.forEach(function (m) {
        utils.writeTo(m.content, m.path);
    });
}

function coolDown() {
    modules.forEach(function (m) {
        // XXX |scheduleToRemove(m.path)| fails.
        // Why do we need to prepend baseURL?
        utils.scheduleToRemove(baseURL + m.path);
    });
}

function testExtend() {
    var o = { bar: 0 };
    extend(o, {
        _foo: "",
        get foo () this._foo.toUpperCase(),
        set foo (val) this._foo = val + "",
        bar: 42
    });
    o.foo = "hello";
    assert.equals(o.foo, "HELLO");
    assert.equals(o.bar, 42);

    extend(o, { bar: 12 }, false);
    assert.equals(o.bar, 42);
}

function testLoadModules() {
    loadModules();
    assert.equals(Foo.baz, 42);
    assert.equals(typeof Bar, "undefined");
    assert.equals(Hoge.piyo, 42);

    var root = { loadModules: loadModules };
    root.loadModules();
    assert.equals(root.Foo.baz, 42);
}

function testNewURI() {
    let uri = newURI('http://example.org/');
    assert.isTrue(uri instanceof Components.interfaces.nsIURI);
    assert.equals('http://example.org/', uri.spec);

    assert.equals('http://example.org/foo',
                  newURI('foo', 'http://example.org/').spec);
    assert.equals('http://example.org/foo',
                  newURI('foo', newURI('http://example.org/')).spec);
    assert.equals('http://example.org/foo',
                  newURI('foo', null, 'http://example.org/').spec);
    assert.equals('http://example.org/foo',
                  newURI('foo', null, newURI('http://example.org/')).spec);

    assert.equals('shift_jis',
                  newURI('http://example.org/', 'shift_jis').originCharset);
}

function testBindMethod() {
    let f = function(arg) {
        return this.foo + arg;
    };
    assert.equals(bind(f, {foo: 1})(0), 1);
    assert.equals(bind(f, {foo: 1})(1), 2);
    assert.equals(bind(f, {foo: 1}, 2)(4), 3);
    let f1 = new function() {
        this.bar = 1;
        this.callBar = function() this.bar;
    };
    assert.equals(f1.callBar(), 1);
    assert.equals(method(f1, 'callBar')(), 1);
    assert.equals(method(f1, 'callBar').apply({bar: 2}), 1);
}

function testJSON() {
    assert.equals({ foo: 42 }, JSON.parse('{ "foo": 42 }'));
    let status = 'PASS';
    try {
        JSON.parse('<error>');
    } catch (ex) {
        status = 'THROWN';
    }
    assert.equals(status, 'THROWN', 'JSON.parse should throw for invalid input.');

    assert.equals('[23,42]', JSON.stringify([23, 42]));
}

//function testDecodeReferences() {
//    assert.equals("\u00abHello &unknown; 日本語 <world>\u00bb",
//                  decodeReferences("&laquo;H&#101;llo &unknown; 日本&#x8a9e; &lt;&#x77;orld&gt;&raquo;"));
//}
//
//function testIRI() {
//    var iri = "http://日本語.jp/天気";
//    assert.equals("http://xn--wgv71a119e.jp/%E5%A4%A9%E6%B0%97",
//                  iri2uri(iri));
//    assert.equals("http%3A%2F%2Fxn--wgv71a119e.jp%2F%25E5%25A4%25A9%25E6%25B0%2597",
//                  escapeIRI(iri));
//}

function testXMLExtras() {
    let u = Cu.import(MODULE, {});

    let xhr = new u.XMLHttpRequest();
    assert.isFunction(xhr.open);
    assert.isTrue(xhr.onload === null);
    assert.isTrue(xhr instanceof Ci.nsIXMLHttpRequest);

    let parser = new u.DOMParser();
    let doc = parser.parseFromString("<x/>", "application/xml");
    assert.equals("x", doc.documentElement.nodeName);
    assert.isTrue(parser instanceof Ci.nsIDOMParser);

    let serializer = new u.XMLSerializer();
    assert.equals("<x/>", serializer.serializeToString(doc));
    assert.isTrue(serializer instanceof Ci.nsIDOMSerializer);
}
