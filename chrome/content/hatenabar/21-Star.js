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

        // 各 web ページにスターのスクリプトを読み込む
        // XXX 読み込み処理でエラーが出ていたので読み込み方法を変更して修正したが,
        // そもそもスクリプトを読み込みが成功してもうまく動いてないような気がする
        var scriptUriStr = "chrome://hatenabar/content/load-or-check-star.js";
        // Web ページの window オブジェクトを継承したスコープのためのオブジェクト
        var scopeObj = Object.create(win, {
            config:    { value: config },
            scriptURL: { value: this.scriptURL },
        });
        var jsSubScriptLoader = Cc["@mozilla.org/moz/jssubscript-loader;1"].
                                  getService(Ci.mozIJSSubScriptLoader);
        // 同期で読み込んで何かあるとことなので念のために遅延させる。
        win.setTimeout(function () {
            jsSubScriptLoader.loadSubScript(scriptUriStr, scopeObj, "UTF-8");
        }, 11);
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
