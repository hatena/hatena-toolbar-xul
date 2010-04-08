const EXPORT = ['Star'];

var Star = {
    SiteConfig: shared.get('Star.SiteConfig'),

    get siteConfigURL () HatenaLink.parseToURL('s:siteconfig.json'),
    get scriptURL () HatenaLink.parseToURL('s:js:HatenaStar.js'),

    init: function S_init() {
        gBrowser.addEventListener('DOMContentLoaded', this, false);

        if (!this.SiteConfig) {
            // XXX Use net.http or something else.
            let xhr = new XMLHttpRequest();
            xhr.open('GET', this.siteConfigURL);
            xhr.onload = bind(onSiteConfigLoaded, this);
            xhr.send(null);
        }

        function onSiteConfigLoaded(event) {
            let sc = JSON.parse(event.target.responseText);
            shared.set('Star.SiteConfig');
            this.SiteConfig = sc;
        }
    },

    load: function S_load(win) {
        // XXX return if star is disabled.
        if (!this.SiteConfig || !/^https?:/.test(win.location.protocol))
            return;
        if (win.top != win ||
            !(win.document instanceof Ci.nsIDOMHTMLDocument))
            return;
        let host = win.location.hostname;
        let config = this.SiteConfig[host] ||
                     this.SiteConfig[host.replace(/^[^.]+/, '*')] ||
                     null;
        if (!config) return;
        let path = win.location.pathname;
        let script = this.scriptURL;
        let func = 'javascript:(' + this._loadStar.toSource() + ')';
        for (let i = 0; i < config.length; i++) {
            if (!path.match(config[i].path)) continue;
            let code = func + '(' + [config[i], script].map(uneval).join(',') + ');';
            win.location.href = encodeURI(code);
            break;
        }
    },

    // This function is executed in the context of the web page.
    _loadStar: function S__loadStar(entryConfig, scriptSrc) {
        function ensure(object, prop, value) {
            if (typeof object[prop] === 'undefined')
                object[prop] = value || {};
        }
        ensure(window, 'Hatena');
        ensure(Hatena, 'Star');
        if (Hatena.Star.loaded) {
            onStarsLoaded();
            return;
        }
        ensure(Hatena.Star, 'onLoadFunctions', []);
        Hatena.Star.onLoadFunctions.push(onPreload);
        Hatena.Star.SiteConfig = entryConfig;
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.charset = 'utf-8';
        script.src = scriptSrc;
        var parent = document.getElementsByTagName('head')[0] || document.body;
        parent.appendChild(script);

        function onPreload() {
            Hatena.Star.EntryLoader.addEventListener('load', onStarsLoaded);
        }
        function onStarsLoaded() {
            if (!Hatena.Star.EntryLoader.entries.length) return;
            var event = document.createEvent('Event');
            event.initEvent('hatenabar-stars-loaded', true, false);
            document.dispatchEvent(event);
        }
    },

    handleEvent: function S_handleEvent(event) {
        if (event.type === 'DOMContentLoaded')
            this.load(event.target.defaultView);
    },
};

doOnLoad(function () Star.init());
