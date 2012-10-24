(function () {

/**
 * modules/20-ExpireCache.js のテスト
 */

var modules = {};

Components.utils.import('resource://hatenabar/modules/00-core.js',modules);
Components.utils.import('resource://hatenabar/modules/20-ExpireCache.js',modules);

QUnit.module( "ExpireCache" );

QUnit.asyncTest( "XML Document オブジェクトの serialize と deserialize", 4, function () {

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

} );

}).call( this );
