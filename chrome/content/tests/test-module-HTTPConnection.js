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

    var xmlStr = "<test>aaa</test>";
    var doc = domParser.parseFromString(xmlStr,"application/xml");
    ok( createResponse(xmlStr).xml.isEqualNode( doc ),
        "XHR オブジェクトに responseXML プロパティがあればそれを返してくれる" );

    var xmlStr = "<test>aaa</test>";
    var doc = domParser.parseFromString(xmlStr,"application/xml");
    ok( createResponse(xmlStr, null).xml.isEqualNode( doc ),
        "XHR オブジェクトに responseXML プロパティがなくても responseText を解析してくれる" );

    var xmlStr = "aaa";
    strictEqual( createResponse(xmlStr, null).xml, null,
        "XHR オブジェクトに responseXML プロパティがなく, responseText を XML として解析できなければ null を返す" );

    var xmlStr = "";
    strictEqual( createResponse(xmlStr, null).xml, null,
        "XHR オブジェクトに responseXML プロパティがなく, responseText が空文字列なら null を返す" );

    var xmlStr = "&";
    strictEqual( createResponse(xmlStr, null).xml, null,
        "XHR オブジェクトに responseXML プロパティがなく, responseText が '&' だけの場合は XML として無効なので null が返る" );

    var xmlStr = "<test aaaa='>属性が閉じられていない</test>";
    strictEqual( createResponse(xmlStr, null).xml, null,
        "XHR オブジェクトに responseXML プロパティがなく, responseText が属性を閉じ忘れた XML ならば, 解析できないので null が返る" );

    QUnit.start(); // テスト再開

} );

}).call( this );
