(function () {

/**
 * modules/20-ExpireCache.js のテスト
 */

var modules = {};

Components.utils.import('resource://hatenabar/modules/00-core.js',modules);
Components.utils.import('resource://hatenabar/modules/20-ExpireCache.js',modules);

QUnit.module( "ExpireCache" );

QUnit.asyncTest("XML Document オブジェクトの serialize と deserialize", 4, function () {

    var xmlSerializer = modules.ExpireCache.Serializer.xml;
    var domParser = new modules.DOMParser();
    function serializeAndDeserialize( doc ) {
        var serializedDoc = xmlSerializer.serialize(doc);
        return xmlSerializer.deserialize(serializedDoc);
    }

    var doc = domParser.parseFromString("<test>aaa</test>","text/xml");
    ok( doc.isEqualNode(serializeAndDeserialize(doc)),
        "単純な XML 文書の serialize, deserialize ができる" );

    var doc = domParser.parseFromString(
        "<test>aaa<bb>good?</bb><c>&amp;<d>&lt;</d></c></test>","text/xml");
    ok( doc.isEqualNode(serializeAndDeserialize(doc)),
        "深い階層をもつ XML 文書の serialize, deserialize ができる" );

    var doc = domParser.parseFromString(
        "<test xmlns='http://b.hatena.ne.jp' xmlns:hb='http://b.hatena.ne.jp/hb'>aaa" +
          "<bb xmlns='http://b.hatena.ne.jp/bb'>good?" +
            "<hb:c>この要素の名前空間は http://b.hatena.ne.jp/hb</hb:c>" +
          "</bb>" +
        "</test>","text/xml"
    );
    ok( doc.isEqualNode(serializeAndDeserialize(doc)),
        "名前空間をもつ XML 文書の serialize, deserialize ができる" );

    strictEqual( serializeAndDeserialize(null), null,
        "null の serialize, deserialize 結果が null になる" );

    QUnit.start(); // テスト再開

});

QUnit.test("uneval シリアライザを使った ExpireCache", 2, function () {
    var cache = new modules.ExpireCache("unevaltest", null, "uneval");
    cache.set("foo", {foo: 1, bar: 2});
    strictEqual(1, cache.get("foo").foo);
    strictEqual(2, cache.get("foo").bar);
});

QUnit.test("xml シリアライザを使った ExpireCache", 1, function () {
    var cache = new modules.ExpireCache("xmltest", null, "xml");
    var domParser = new modules.DOMParser();
    var doc = domParser.parseFromString("<test>aaa</test>","text/xml");
    cache.set("foo", doc);
    ok( doc.isEqualNode(cache.get("foo")),
        "DOM Document オブジェクトのキャッシュへの保存ができる" );
});

QUnit.test("異なるキーの複数キャッシュオブジェクトは領域を共有しない", 5, function () {
    var cache = new modules.ExpireCache();
    var cache2 = new modules.ExpireCache("foo");

    cache.set("foo", 1);
    ok(cache.has("foo"));
    ok(!cache.has("oooo"));
    strictEqual(cache.get("foo"), 1);
    ok(cache2.get("foo") === null);
    ok(!cache2.get("foo"));
});

QUnit.test("真偽評価すると偽になる値をセットしても `has` メソッドは真を返す", 4, function () {
    var cache = new modules.ExpireCache("test");

    cache.set("f", 0);
    ok(cache.has("f"));
    cache.set("f2", false);
    ok(cache.has("f2"));
    cache.set("f3", null);
    ok(cache.has("f3"));
    cache.set("f4", void 0);
    ok(cache.has("f4"));
});

QUnit.asyncTest("Expire を指定すると指定時間後にはキャッシュから消える", 4, function () {
    var cache = new modules.ExpireCache("test");
    // キャッシュ時間を 0.2 s にしてキャッシュにセット
    cache.set("bar", 1, 0.2);
    ok(cache.get("bar"), 1, "直後には存在する");
    ok(cache.has("bar"));
    setTimeout(function () {
        ok(cache.get("bar") === null, "300 ms 後には存在しない");
        ok(!cache.has("bar"));

        QUnit.start();
    }, 300);
});

}).call( this );
