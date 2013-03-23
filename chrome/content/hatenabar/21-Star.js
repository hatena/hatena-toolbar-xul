const EXPORT = ['Star'];

var Star = {
    SiteConfig: shared.get('Star.SiteConfig'),
    prefs: Prefs.hatenabar.getChildPrefs('star'),

    siteConfigURL: HatenaLink.parseToURL('s:siteconfig.json'),
    // 将来的に国際化すると、設定によってスクリプトの URL が
    // 変わるかもしれないからゲッタを使う。
    get scriptURL() HatenaLink.parseToURL('s:js:HatenaStar.js'),

    init: function Star_init() {
        gBrowser.addEventListener('DOMContentLoaded', this, false);
        gBrowser.addEventListener('hatenabar-stars-loaded', this, false, true);
        if (!this.SiteConfig)
            this.loadSiteConfig();
    },

    loadSiteConfig: function Star_loadSiteConfig() {
        http.get(this.siteConfigURL, bind(onSiteConfigLoaded, this));
        function onSiteConfigLoaded(res) {
            if (!res.value) return;
            shared.set('Star.SiteConfig', res.value);
            this.SiteConfig = res.value;
            p('Star.SiteConfig is updated');
        }
    },

    load: function Star_load(doc) {
        let win = doc.defaultView;
        if (!this.SiteConfig ||
            win.top != win ||
            !/^https?:/.test(win.location.protocol) ||
            !(doc instanceof Ci.nsIDOMHTMLDocument))
            return;
        let config = null;
        if (this.prefs.get('anywhere')) {
            let host = win.location.hostname;
            let path = win.location.pathname;
            let configs = this.SiteConfig[host] ||
                          this.SiteConfig[host.replace(/^[^.:]+/, '*')] ||
                          [];
            for (let i = 0; i < configs.length; i++) {
                if (path.match(configs[i].path)) {
                    config = configs[i];
                    break;
                }
            }
        }

        // document.body に script を追加するので, 存在しない場合は終了
        if (!win.document.body) return;
        // 各 web ページにスターのスクリプトを読み込む
        var starScriptUriStr = this.scriptURL;
        // 同期で読み込んで何かあるとことなので念のために遅延させる。
        win.setTimeout(function () {
            // 読み込む JS ファイルをテキストで取得して script 要素に突っ込む
            var xhr = XMLHttpRequest();
            var scriptUriStr = "chrome://hatenabar/content/load-or-check-star.js";
            xhr.open("GET", scriptUriStr, true);
            xhr.responseType = "text";
            xhr.addEventListener("load", function (evt) {
                var scriptStr = xhr.responseText;
                insertScriptToWebContent(scriptStr, config, starScriptUriStr);
            }, false);
            xhr.send();
        }, 11);
        function insertScriptToWebContent(scriptStr, config, starScriptUriStr) {
            var scriptElem = win.document.createElement("script");
            scriptElem.textContent = scriptStr;
            scriptElem.setAttribute(
                    "data-comment",
                    "This `script` element is inserted by “Hatena Toolbar for Firefox”.");

            // web ページ上で実行されるスクリプトに渡すための情報を要素で作る
            var HATENABAR_NS = "http://www.hatena.ne.jp/hatenabar_firefox";
            var infoElem = win.document.createElementNS(HATENABAR_NS, "hatena-star-info");
            infoElem.setAttribute("config", JSON.stringify([config]));
            infoElem.setAttribute("star-script-uri", JSON.stringify([starScriptUriStr]));
            infoElem.setAttribute(
                    "data-comment",
                    "This element is inserted by “Hatena Toolbar for Firefox”.");

            win.document.documentElement.appendChild(infoElem);
            win.document.body.appendChild(scriptElem);
        }
    },

    hasEntries: function Star_hasEntries(doc) {
        return !!(doc && doc._hatenabar_hasStars);
    },

    onStarsLoaded: function Star_onStarsLoaded(doc) {
        doc._hatenabar_hasStars = true;
        this.dispatch('StarsLoaded', doc);
    },

    handleEvent: function Star_handleEvent(event) {
        switch (event.type) {
        case 'DOMContentLoaded':
            this.load(event.target);
            break;
        case 'hatenabar-stars-loaded':
            this.onStarsLoaded(event.target);
            break;
        }
    },
};

EventService.bless(Star);

doOnLoad(function () Star.init());
