const EXPORT = ['Bookmark'];

var Bookmark = {
    init: function B_init() {
        gBrowser.addEventListener('DOMContentLoaded', this, false);
    },

    add: function B_add(win) {
        if (typeof hBookmark !== 'undefined') {
            hBookmark.AddPanelManager.showPanel(win);
            return;
        }
        let doc = win.document;
        let script = doc.createElementNS(XHTML_NS, 'script');
        script.type = 'text/javascript';
        script.charset = 'utf-8';
        script.src = HatenaLink.parseToURL('b:js:Hatena:Bookmark:let.js') +
                     '?' + new Date().toLocaleFormat('%Y%m%d');
        let parent = doc.getElementsByTagName('head')[0] || doc.body;
        parent.appendChild(script);
    },

    addSearchButton: function B_addSearchButton(win) {
        if (!win || !win.location || win.location.protocol !== 'http:')
            return;
        let config = this.SiteConfig[win.location.host];
        if (!config ||
            (config.path && !win.location.pathname.match(config.path)))
            return;
        let doc = win.document;
        if (!(doc instanceof Ci.nsIDOMHTMLDocument) ||
            !gBrowser.getBrowserForDocument(win.document))
            return;
        let form = doc.forms.namedItem(config.form);
        if (!form) return;
        let input = form.elements.namedItem(config.input);
        if (!input) return;
        let query = input.value;
        let href = HatenaLink.parseToURL('b:search', { query: query });
        let text = '{{Search "' + query + '" by Hatena Search}}';
        let src = HatenaLink.parseToURL('b:images:search-mini.png');
        let code = 'javascript:(' + addHatenaSearchButton.toSource() + ')(' +
            [config, href, text, src].map(uneval).join(',') + ')';
        win.location.href = encodeURI(code);

        // This function is executed in the context of the web page.
        // The original file for this function is:
        // http://www.hatena.ne.jp/js/hatenabar_bookmarksearch.js
        function addHatenaSearchButton(config, href, text, src) {
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
            a.appendChild(img);
            container.appendChild(a);
        }
    },

    handleEvent: function B_handleEvent(event) {
        if (event.type === 'DOMContentLoaded')
            this.addSearchButton(event.target.defaultView);
    },
};

// The original file for this settings is:
// http://www.hatena.ne.jp/js/hatenabar_bookmarksiteconfig.json
Bookmark.SiteConfig = {
    'www.google.co.jp': {
        'path': '^/search',
        'form': 'gs',
        'input':'q',
        'parent': true,
        'xpath': '//table/tbody/tr/td[@class="nobr xsm"]',
    },
    'www.google.com': {
        'path': '^/search',
        'form': 'gs',
        'input':'q',
        'parent': true,
        'xpath': '//table/tbody/tr/td[@class="nobr xsm"]',
    },
    'search.yahoo.co.jp': {
        'form': 'sbn',
        'input':'p',
        'parent': false,
        'xpath': 'id("ygma")/div[@class="searchForm-opt"]',
    },
};

doOnLoad(function () Bookmark.init());
