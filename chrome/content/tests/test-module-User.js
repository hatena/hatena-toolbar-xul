(function () {

/**
 * modules/11-User.js のテスト
 */

var modules = {};
Components.utils.import( "resource://hatenabar/modules/11-User.js", modules );
Components.utils.import( "resource://hatenabar/modules/12-HTTPConnection.js", modules );

QUnit.module( "User" );

QUnit.asyncTest( "ログイン時にサーバーに問い合わせて情報取得", 6, function () {
    var userName = "testuser";
    var rk = "336d8efc277c3b7270b41107769758";

    var bookmarkTabInfo = { "tabs": [
                    {"label":"チュートリアル","path":"/testuser/tutorial"},
                    {"label":"コレクション","path":"/testuser/asin"},
                    {"label":"Twitter","path":"/testuser/twitter"}
                ] };
    var bookmarkTabInfoJson = JSON.stringify( bookmarkTabInfo );
    var groupNames = [ "hatenawiki", "animation", "hatena", "theme", "sakuraya" ];
    var rkgroupXmlString =
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<hatena:rkgroup xmlns:hatena="http://www.hatena.ne.jp/tools/hatenarkgroup.rdf#">' +
        '<rkgroup userid="testuser">' +
        groupNames.map(function (e) { return "<group>" + e + "</group>" }).join("") +
        '</rkgroup></hatena:rkgroup>';

    var user = new modules.User( userName );

    // HTTP 通信をテスト用にシミュレート
    user._http = Object.create( modules.http );
    // 本当は HTTPConnection.Request を変えて URL に応じた返り値を返したいが
    // 結構大変そうなのでとりあえず http.getWithRetry の動きをテスト用に変える
    user._http.getWithRetry = function ( options, onSuccess ) {
        if ( options === "http://b.hatena.ne.jp/my.tabs" ) {
            var mockXhr = {
                status: 200,
                responseText: bookmarkTabInfoJson,
                responseXML: null
            };
        } else if ( typeof options === "string" ) {
            throw new Error( "テストされないはずの URI : " + options );
        } else if ( options.url === "http://g.hatena.ne.jp/rkgroup" ) {
            var domParser = new DOMParser();
            var mockXhr = {
                status: 200,
                responseText: rkgroupXmlString,
                responseXML: domParser.parseFromString(rkgroupXmlString,"application/xml")
            };
        } else {
            throw new Error( "テストされないはずの URI : " + options.url );
        }
        var res = new modules.HTTPConnection.Response({ request: mockXhr });
        setTimeout( function () {
            onSuccess( res );
        }, 4 );
    };

    ok( typeof user._bookmarkTabs === "undefined",
        "ログイン前の user._bookmarkTabs は undefined" );
    ok( typeof user._groups === "undefined",
        "ログイン前の user._groups は undefined" );
    user.onLogin( rk );
    // テスト用のレスポンスは setTimeout により 4 ms 後に返ってくるので 4 ms 待てばよい
    setTimeout( function () {
        ok( Array.isArray(user._bookmarkTabs),
            "ログイン時のリクエストが正常に処理された後の user._bookmarkTabs は Array オブジェクト" );
        // 別のコンテキストで生成されたオブジェクトなので, 普通に deepEqual で
        // 比較すると失敗する. JSON の stringify / parse することで回避
        deepEqual( JSON.parse(JSON.stringify(user._bookmarkTabs)), bookmarkTabInfo.tabs,
           "user._bookmarkTabs の中身がレスポンスに応じたものになっている" );

        ok( Array.isArray(user._groups),
            "ログイン時のリクエストが正常に処理された後の user._groups は Array オブジェクト" );
        deepEqual( user._groups, groupNames,
           "user._groups の中身がレスポンスに応じたものになっている" );
        user.onLogout();
        QUnit.start(); // テスト再開
    }, 4 );

} );

}).call( this );
