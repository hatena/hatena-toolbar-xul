(function () {

/**
 * modules/12-HTTPConnection.js のテスト
 */

var modules = {};
Components.utils.import('resource://hatenabar/modules/00-core.js', modules);
Components.utils.import('resource://hatenabar/modules/12-HTTPConnection.js', modules);

QUnit.module( "HTTPConnection" );

QUnit.asyncTest( "HTTPConnection.Response#xml プロパティ", 6, function () {

    var domParser = new modules.DOMParser();

    function createResponse( text, xml ) {
        var mockXhr = {
            status: 200,
            responseText: text || "",
            responseXML: ( typeof xml !== "undefined" ) ? xml
                       : text ? domParser.parseFromString(text,"application/xml")
                       :        null
        };
        return new modules.HTTPConnection.Response({ request: mockXhr });
    }

    // equal メソッドは == 演算子による等価性の検査を行う
    // XML オブジェクト (E4X) に対して == 演算子による等価性の検査を行う場合,
    // 同一のオブジェクトでなくても, XML 文書構造が同じであれば等価とみなされる

    var xmlStr = "<test>aaa</test>";
    var xml = new XML(xmlStr);
    equal( createResponse(xmlStr).xml, xml,
        "XHR オブジェクトに responseXML プロパティがあればそれを XML オブジェクトにして返してくれる" );

    var xmlStr = "<test>aaa</test>";
    var xml = new XML(xmlStr);
    equal( createResponse(xmlStr, null).xml, xml,
        "XHR オブジェクトに responseXML プロパティがなくても responseText を解析してくれる" );

    var xmlStr = "aaa";
    ok( typeof createResponse(xmlStr, null).xml === "xml",
        "XHR オブジェクトに responseXML プロパティがなくても, responseText が XML の一部として解析できるならば XML オブジェクトが返ってくる" );

    var xmlStr = "";
    ok( typeof createResponse(xmlStr, null).xml === "xml",
        "XHR オブジェクトに responseXML プロパティがなく, responseText が空文字列なら XML オブジェクトが返ってくる" );

    var xmlStr = "&";
    strictEqual( createResponse(xmlStr, null).xml, null,
        "XHR オブジェクトに responseXML プロパティがなく, responseText が '&' だけの場合は XML の一部としても解析できないので null が返る" );

    var xmlStr = "<test aaaa='>属性が閉じられていない</test>";
    strictEqual( createResponse(xmlStr, null).xml, null,
        "XHR オブジェクトに responseXML プロパティがなく, responseText が属性を閉じ忘れた XML ならば, 解析できないので null が返る" );

    QUnit.start(); // テスト再開

} );

}).call( this );
