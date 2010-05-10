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
        let code = 'javascript:(' + this._loadOrCheckStar.toSource() + ')(' +
            [config, this.scriptURL].map(uneval).join(',') + ');';
        // 同期で読み込んで何かあるとことなので念のために遅延させる。
        //win.location.href = encodeURI(code);
        win.setTimeout(function () win.location.href = encodeURI(code), 11);
    },

    // This function is executed in the context of the web page.
    _loadOrCheckStar: function Star__loadOrCheckStar(config, scriptURL) {
        if (!config && (!window.Hatena || !Hatena.Star)) return;
        function ensure(object, prop, value) {
            if (typeof object[prop] === 'undefined')
                object[prop] = value || {};
        }
        ensure(window, 'Hatena');
        ensure(Hatena, 'Star');
        if (Hatena.Star.loaded) {
            onPreload();
            return;
        } else {
            ensure(Hatena.Star, 'onLoadFunctions', []);
            Hatena.Star.onLoadFunctions.push(onPreload);
            Hatena.Star.SiteConfig = config;
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.charset = 'utf-8';
            script.src = scriptURL;
            var parent = document.getElementsByTagName('head')[0] ||
                         document.body;
            parent.appendChild(script);
        }

        function onPreload() {
            // load のタイミングがよくわからないのでとりあえず
            // リスナ登録も即時呼び出しもやってみる。
            Hatena.Star.EntryLoader.addEventListener('load', onStarsLoaded);
            onStarsLoaded();
        }
        function onStarsLoaded() {
            if (!Hatena.Star.EntryLoader.entries ||
                !Hatena.Star.EntryLoader.entries.length)
                return;
            var event = document.createEvent('Event');
            event.initEvent('hatenabar-stars-loaded', true, false);
            document.dispatchEvent(event);
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
