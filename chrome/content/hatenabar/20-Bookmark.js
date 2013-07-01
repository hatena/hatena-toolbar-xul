const EXPORT = ['Bookmark'];

var Bookmark = {
    init: function B_init() {
        gBrowser.addEventListener('DOMContentLoaded', this, false);

        let update = method(this, 'updateShouldAddSearchButton');
        Prefs.hatenabar.createListener('bookmark.showSearchOnWeb', update);
        update();
    },

    shouldAddSearchButton: false,

    updateShouldAddSearchButton: function B_updateShouldAddSearchButton() {
        this.shouldAddSearchButton =
            Prefs.hatenabar.get('bookmark.showSearchOnWeb');
    },

    /**
     * Show a form to add new bookmark (not browser's bookmark, but bookmark of Hatena Bookmark).
     */
    add: function B_add(win) {
        if (Prefs.hatenabar.get('bookmark.useHatenaBookmarkExtension') &&
            typeof hBookmark !== 'undefined') {
            hBookmark.AddPanelManager.showPanel(win);
            return;
        }

        var targetUrl = win.document.location.href;
        var bookmarkletUrl = "http://b.hatena.ne.jp/bookmarklet" +
                "?url="   + encodeURIComponent(targetUrl) +
                "&title=" + encodeURIComponent(win.document.title);
        var winFeatures =
                "width=520,height=520,menubar=no,location=yes,resizable=yes,scrollbars=yes";
        window.open(bookmarkletUrl, "_blank", winFeatures);
    },

    addSearchButton: function B_addSearchButton(win) {
        if (win.top !== win || win.location.protocol !== 'http:') return;
        let config = this.SiteConfig[win.location.host];
        if (!config ||
            (config.path && !win.location.pathname.match(config.path)))
            return;
        let doc = win.document;
        if (!(doc instanceof Ci.nsIDOMHTMLDocument)) return;
        let form = doc.forms.namedItem(config.form);
        if (!form) return;
        let input = form.elements.namedItem(config.input);
        if (!input) return;
        let query = input.value;
        let href = HatenaLink.parseToURL('b:search', { query: query });
        let text =
            Browser.strings.get('bookmark.searchOnWeb.button.tooltip', query);
        let src = HatenaLink.parseToURL('b:images:search-mini.png');
        let code = 'javascript:(' + this._addSearchButton.toSource() + ')(' +
            [config, href, text, src].map(uneval).join(',') + ')';
        // 同期で読み込んで何かあるとことなので念のために遅延させる。
        //win.location.href = encodeURI(code);
        win.setTimeout(function () win.location.href = encodeURI(code), 11);
    },

    // This function is executed in the context of the web page.
    // The original file for this function is:
    // http://www.hatena.ne.jp/js/hatenabar_bookmarksearch.js
    _addSearchButton: function B__addSearchButton(config, href, text, src) {
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
    },

    handleEvent: function B_handleEvent(event) {
        if (event.type === 'DOMContentLoaded' &&
            this.shouldAddSearchButton)
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
        'xpath': '//table/tbody/tr/td[@class="nobr xsm"] | id("subform_ctrl")/div/a[@class="gl nobr"]',
    },
    'www.google.com': {
        'path': '^/search',
        'form': 'gs',
        'input':'q',
        'parent': true,
        'xpath': '//table/tbody/tr/td[@class="nobr xsm"] | id("subform_ctrl")/div/a[@class="gl nobr"]',
    },
    'search.yahoo.co.jp': {
        'form': 'sbn',
        'input':'p',
        'parent': false,
        'xpath': 'id("ygma")/div[@class="searchForm-opt"]',
    },
};

doOnLoad(function () Bookmark.init());
