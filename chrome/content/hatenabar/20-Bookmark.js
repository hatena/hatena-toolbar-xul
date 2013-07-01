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

        var that = this;
        win.setTimeout(function () {
            that._loadLocalScript(that.ADD_SEARCH_BUTTON_URI, function (scriptStr) {
                var args = {
                    config: config,
                    href: href,
                    text: text,
                    src: src,
                };
                scriptStr =
                    "(function (args) {\n" +
                        scriptStr +
                    "\n}).call(this," + JSON.stringify(args) + ");";
                that._insertScriptToWebContent(doc, scriptStr);
            });
        }, 11);
    },

    ADD_SEARCH_BUTTON_URI: "chrome://hatenabar/content/contentscripts/addSearchButton.js",

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
        'form': 'f',
        'input':'q',
        'parent': true,
        'xpath': '//div[@class="nojsb"]/..',
    },
    'www.google.com': {
        'path': '^/search',
        'form': 'f',
        'input':'q',
        'parent': true,
        'xpath': '//div[@class="nojsb"]/..',
    },
    'search.yahoo.co.jp': {
        'form': 'sbn',
        'input':'p',
        'parent': true,
        'xpath': '//div[@class="searchForm-opt"]',
    },
};

doOnLoad(function () Bookmark.init());
