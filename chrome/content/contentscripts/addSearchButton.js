/**
 * This function is executed in the context of the web page.
 * The original file for this function is:
 * - http://www.hatena.ne.jp/js/hatenabar_bookmarksearch.js
 *
 * Web ページ側に追加されて実行されるスクリプト。 実際に読み込まれる際にはこのスクリプトは
 * 関数本体として読み込まれる。 関数の引数として `args` が渡されるので、その値を使用できる。
 *
 * 特権コードと web 上のスクリプトのデータのやりとりが必要になったら次の文書を参考にすること
 * - https://developer.mozilla.org/ja/docs/Code_snippets/Interaction_between_privileged_and_non-privileged_pages
 */

var config = args.config;
var href = args.href;
var text = args.text;
var src = args.src;

function ensure(object, prop, value) {
    if (typeof object[prop] === 'undefined')
        object[prop] = value || {};
}
ensure(window, 'Hatena');
ensure(Hatena, 'Bookmark');
if (Hatena.Bookmark.loaded) return;
ensure(Hatena.Bookmark, 'onLoadFunctions', []);
ensure(Hatena.Bookmark, 'log', function () {});
Hatena.Bookmark.SiteConfig = config;
var container = document.evaluate(
    config.xpath, document, null,
    XPathResult.FIRST_ORDERED_NODE_TYPE, null
).singleNodeValue;
if (!container) return;
if (config.parent)
    container = container.parentNode;
if (container instanceof HTMLTableRowElement)
    container = container.appendChild(document.createElement('td'));
var a = document.createElement('a');
a.href = href;
a.title = text;
var img = document.createElement('img');
img.src = src;
img.alt = text;
img.style.border = 'none';
img.style.verticalAlign = 'middle';
a.appendChild(img);
container.appendChild(document.createTextNode(' '));
container.appendChild(a);
