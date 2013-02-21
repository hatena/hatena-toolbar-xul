/**
 * This function is executed in the context of the web page.
 * Web ページ側に追加されて実行されるスクリプト.
 *
 * see: https://developer.mozilla.org/ja/docs/Code_snippets/Interaction_between_privileged_and_non-privileged_pages
 * 特権コードと web 上のスクリプトのデータのやりとり
 */

(function namespace_loadOrCheckStar() {

// 特権コードが追加した要素を取得して情報を得る
var HATENABAR_NS = "http://www.hatena.ne.jp/hatenabar_firefox";
var infoElem = document.getElementsByTagNameNS(HATENABAR_NS, "hatena-star-info")[0];
if (!infoElem) {
    return;
}
var config = JSON.parse(infoElem.getAttribute("config"))[0];
var scriptURL = JSON.parse(infoElem.getAttribute("star-script-uri"))[0];

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
            "This `script` element is inserted by “Hatena Toolbar for Firefox”.");

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
