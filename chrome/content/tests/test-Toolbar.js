(function () {

/**
 * chrome/content/hatenabar/31-Toolbar.js のテスト
 */

var global = this;
var modules = {};
Components.utils.import( "resource://hatenabar/modules/12-HTTPConnection.js", modules );

QUnit.module( "Toolbar" );

// Firefox 14 だとテストにとおるが 16 beta だととおらない (E4X のため)
QUnit.asyncTest( "Toolbar.onGotReferredCount メソッド", function () {
    var attributeChangeLog = [];

    // Toolbar オブジェクトをテストするため, Toobar オブジェクトを継承した
    // オブジェクトを生成して, そのオブジェクトのプロパティを書き換える
    var ToolbarForTest = Object.create( Toolbar );
    Object.defineProperty( ToolbarForTest, "includingAntennaCommand", {
        value: {
            setAttribute: function ( name, value ) {
                attributeChangeLog.push([ "set", name, value ]);
            },
            removeAttribute: function ( name ) {
                attributeChangeLog.push([ "remove", name ]);
            }
        }
    } );
    var diaryCheckerElem = document.createElementNS( XUL_NS, "toolbarbutton" );
    diaryCheckerElem.setAttribute( "defaultlabel", "-" );
    Object.defineProperty( ToolbarForTest, "diaryChecker", {
        value: diaryCheckerElem
    } );

    // 表示中のページの URI をテスト用の URI に見せかける
    global.content = {};
    global.content.location = {};
    Object.defineProperty( global.content.location, "href", {
        get: function () { return url }
    } );

    // テスト用関数
    var domParser = new DOMParser();
    /**
     * テストを実行する
     * @param text responseText を表す文字列. 存在しなければ responseText は空文字列になる
     * @param xml responseXML を表す XML DOM オブジェクト. undefined ならば text を parse
     *      した結果が responseXML になり, それも存在しなければ null
     */
    function exec_onGotReferredCount( text, xml ) {
        var mockXhr = {
            status: 200,
            responseText: text || "",
            responseXML: ( typeof xml !== "undefined" ) ? xml
                       : text ? domParser.parseFromString(text,"application/xml")
                       :        null
        };
        var res = new modules.HTTPConnection.Response({ request: mockXhr });
        ToolbarForTest.onGotReferredCount( url, res.xml );
    }
    /**
     * HTTP GET に失敗した場合をテストする
     */
    function exec_onGotReferredCountWithHTTPError() {
        // HTTP GET に失敗した場合は null が渡される
        ToolbarForTest.onGotReferredCount( url, null );
    }

    var diaryExistXmlStr;
    var url;

    url = "http://test.example.com/";
    diaryExistXmlStr =
        '<?xml version="1.0"?>' +
        '<existxml>' +
          '<count name="diary">3</count>' +
          '<count name="antenna">1</count>' +
        '</existxml>';
    attributeChangeLog.splice( 0, attributeChangeLog.length );
    exec_onGotReferredCount( diaryExistXmlStr );
    deepEqual( attributeChangeLog, [ ["remove","disabled"] ],
        "含むアンテナが存在する場合は disbled 属性が取り除かれる" );
    strictEqual( diaryCheckerElem.label, 3,
        "含むブログの数が label プロパティに設定される" );

    url = "https://test.example.com/";
    diaryExistXmlStr =
        '<?xml version="1.0"?>' +
        '<existxml>' +
          '<count name="diary">0</count>' +
          '<count name="antenna">0</count>' +
        '</existxml>';
    attributeChangeLog.splice( 0, attributeChangeLog.length );
    exec_onGotReferredCount( diaryExistXmlStr );
    deepEqual( attributeChangeLog, [ ["set","disabled","true"] ],
        "含むアンテナが存在しない場合は disbled 属性が true に設定される" );
    strictEqual( diaryCheckerElem.label, 0,
        "含むブログの数が label プロパティに設定される" );

    // URI が HTTPS で HTTP response が空文字列の場合
    url = "http://test.example.com/";
    attributeChangeLog.splice( 0, attributeChangeLog.length );
    exec_onGotReferredCount( null );
    deepEqual( attributeChangeLog, [ ["remove","disabled"] ],
        "HTTP GET の結果として XML が取得できなかった場合, URI が HTTP(S) なら含むアンテナへのリンクが有効になる" );
    strictEqual( diaryCheckerElem.label, "-",
        "HTTP GET の結果として XML が取得できなかった場合は, 含むブログのラベルはデフォルト文字列になる" );

    // HTTP GET に失敗した場合
    url = "http://test.example.com/";
    attributeChangeLog.splice( 0, attributeChangeLog.length );
    exec_onGotReferredCountWithHTTPError();
    deepEqual( attributeChangeLog, [ ["remove","disabled"] ],
        "HTTP GET に失敗した場合は, URI が HTTP(S) ならアンテナへのリンクが有効になる" );
    strictEqual( diaryCheckerElem.label, "-",
        "HTTP GET に失敗したらデフォルト値" );

    // HTTP GET に失敗した場合
    url = "about:blank";
    attributeChangeLog.splice( 0, attributeChangeLog.length );
    exec_onGotReferredCountWithHTTPError();
    deepEqual( attributeChangeLog, [ ["set","disabled","true"] ],
        "HTTP GET に失敗した場合で URI が HTTP(S) でなければアンテナへのリンクが無効になる" );
    strictEqual( diaryCheckerElem.label, "-",
        "HTTP GET に失敗したらデフォルト値 (URI が HTTP(S) じゃなくても)" );

    QUnit.start();
} );

}).call( this );
