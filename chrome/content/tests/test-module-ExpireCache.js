(function () {

/**
 * modules/20-ExpireCache.js のテスト
 */

var modules = {};
Components.utils.import('resource://hatenabar/modules/20-ExpireCache.js',modules);

QUnit.module( "ExpireCache" );

QUnit.asyncTest( "XML オブジェクトの serialize と deserialize", 5, function () {

    var xmlSerializer = modules.ExpireCache.Serializer.xml;
    function serializeAndDeserialize( doc ) {
        var serializedDoc = xmlSerializer.serialize(doc);
        return xmlSerializer.deserialize(serializedDoc);
    }

    // equal メソッドは == 演算子による等価性の検査を行う
    // XML オブジェクト (E4X) に対して == 演算子による等価性の検査を行う場合,
    // 同一のオブジェクトでなくても, XML 文書構造が同じであれば等価とみなされる

    var xml = new XML("<test>aaa</test>");
    equal( serializeAndDeserialize(xml), xml,
        "単純な XML 文書の serialize, deserialize ができる" );

    var xml = new XML("<test>aaa<bb>good?</bb><c>&amp;<d>&lt;</d></c></test>","text/xml");
    equal( serializeAndDeserialize(xml), xml,
        "深い階層をもつ XML 文書の serialize, deserialize ができる" );

    var xml = new XML(
        "<test xmlns='http://b.hatena.ne.jp' xmlns:hb='http://b.hatena.ne.jp/hb'>aaa" +
          "<bb xmlns='http://b.hatena.ne.jp/bb'>good?" +
            "<hb:c>この要素の名前空間は http://b.hatena.ne.jp/hb</hb:c>" +
          "</bb>" +
        "</test>","text/xml"
    );
    equal( serializeAndDeserialize(xml), xml,
        "名前空間をもつ XML 文書の serialize, deserialize ができる" );

    strictEqual( serializeAndDeserialize(null), null,
        "null の serialize, deserialize 結果が null になる" );

    var xml = new XML("aaa");
    equal( serializeAndDeserialize(xml), xml,
        "完全な XML 文書としては無効な XML オブジェクトの serialize, deserialize ができる" );

    QUnit.start(); // テスト再開

} );

}).call( this );
