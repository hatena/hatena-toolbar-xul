/**
 * This function is executed in the context of the web page.
 * Web ページの window オブジェクトを継承したオブジェクトをスコープとして
 * 実行されるスクリプト.
 * 下記の変数は, スコープとして生成されたオブジェクトにあらかじめ定義されている.
 *   config
 *   scriptURL
 */

(function namespace_loadOrCheckStar() {

if (!config && (!window.Hatena || !Hatena.Star)) {
    return;
}

function ensure(object, prop, value) {
    if (typeof object[prop] === "undefined")
        object[prop] = value || {};
}
ensure(window, "Hatena");
ensure(Hatena, "Star");
if (Hatena.Star.loaded) {
    onPreload();
    return;
} else {
    ensure(Hatena.Star, "onLoadFunctions", []);
    Hatena.Star.onLoadFunctions.push(onPreload);
    Hatena.Star.SiteConfig = config;

    var scriptElem = document.createElement("script");
    scriptElem.type = "text/javascript";
    scriptElem.charset = "UTF-8";
    scriptElem.src = scriptURL;
    scriptElem.setAttribute(
            "data-comment",
            "この script 要素は Firefox 拡張 「はてなツールバー」 によって挿入されました");

    var parent = document.getElementsByTagName("head")[0] ||
                 document.body;
    parent.appendChild(scriptElem);
}

function onPreload() {
    // load のタイミングがよくわからないのでとりあえず
    // リスナ登録も即時呼び出しもやってみる。
    Hatena.Star.EntryLoader.addEventListener("load", onStarsLoaded);
    onStarsLoaded();
}
function onStarsLoaded() {
    if (!Hatena.Star.EntryLoader.entries ||
        !Hatena.Star.EntryLoader.entries.length)
        return;
    var event = document.createEvent("Event");
    event.initEvent("hatenabar-stars-loaded", true, false);
    document.dispatchEvent(event);
}

}).call(this);
