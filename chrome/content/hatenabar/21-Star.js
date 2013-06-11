const EXPORT = ['Star'];

var Star = {
    // HatenaStar.js 読み込みスクリプト
    STAR_LOAD_SCRIPT_URI_STR: "chrome://hatenabar/content/load-or-check-star.js",
    // HatenaStar.js の URI
    STAR_SCRIPT_URI_STR: "chrome://hatenabar/content/external/HatenaStar.js",

    SiteConfig: shared.get('Star.SiteConfig'),
    prefs: Prefs.hatenabar.getChildPrefs('star'),

    siteConfigURL: HatenaLink.parseToURL('s:siteconfig.json'),

    init: function Star_init() {
        gBrowser.addEventListener('DOMContentLoaded', this, false);
        gBrowser.addEventListener('hatenabar-stars-loaded', this, false, true);
        gBrowser.addEventListener("hatenabarStarLoadRequest", this, false, true);
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

        var that = this;
        // 同期で読み込んで何かあるとことなので念のために遅延させる。
        win.setTimeout(function () {
            // 読み込む JS ファイルをテキストで取得して script 要素に突っ込む
            that._loadLocalScript(Star.STAR_LOAD_SCRIPT_URI_STR, function (content) {
                Star._insertStarScriptLoaderConfigToWebContent(win.document, config);
                Star._insertScriptToWebContent(win.document, content);
            });
        }, 11);
    },

    _loadLocalScript: function (localScriptUri, callbackFunc) {
        var xhr = XMLHttpRequest();
        xhr.open("GET", localScriptUri, true);
        xhr.responseType = "text";
        xhr.overrideMimeType("text/plain;charset=UTF-8");
        xhr.addEventListener("load", function (evt) {
            callbackFunc(xhr.responseText);
        }, false);
        xhr.send();
    },

    _insertScriptToWebContent: function (doc, scriptStr) {
        var scriptElem = doc.createElement("script");
        scriptElem.textContent = scriptStr;
        scriptElem.setAttribute(
                "data-comment",
                "This `script` element is inserted by “Hatena Toolbar for Firefox”.");
        doc.body.appendChild(scriptElem);
    },

    _insertStarScriptLoaderConfigToWebContent: function (doc, config) {
        // web ページ上で実行されるスクリプトに渡すための情報を要素で作る
        var HATENABAR_NS = "http://www.hatena.ne.jp/hatenabar_firefox";
        var infoElem = doc.createElementNS(HATENABAR_NS, "hatena-star-info");
        infoElem.setAttribute("config", JSON.stringify([config]));
        infoElem.setAttribute(
                "data-comment",
                "This element is inserted by “Hatena Toolbar for Firefox”.");
        doc.documentElement.appendChild(infoElem);
    },

    hasEntries: function Star_hasEntries(doc) {
        return !!(doc && doc._hatenabar_hasStars);
    },

    // web content として埋め込んだ HatenaStar.js 読み込みスクリプトが発行するイベントを受け取る
    onStarLoadRequest: function Star_onStarLoadRequest(doc) {
        this._loadLocalScript(Star.STAR_SCRIPT_URI_STR, function (content) {
            Star._insertScriptToWebContent(doc, content);
        });
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
        case "hatenabarStarLoadRequest":
            this.onStarLoadRequest(event.target);
            break;
        }
    },
};

EventService.bless(Star);

doOnLoad(function () Star.init());
