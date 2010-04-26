const EXPORT = ['Command'];

const UI_TAB_IN_BG_PREF = 'browser.tabs.loadBookmarksInBackground';
const CONTENT_TAB_IN_BG_PREF = 'browser.tabs.loadInBackground';

var Command = {
    openUILink: function Cmd_openUILink(link, event) {
        this.openUILinkWith(link, null, event);
    },

    // ここで UI Link とは、はてなのヘルプページへのリンクのような、
    // 現在見ているページとは無関係のページへのものをさす。
    openUILinkWith: function Cmd_openUILinkWith(link, context, event) {
        if (!/^https?:/.test(link))
            link = HatenaLink.parseToURL(link, context);
        let where = this.whereToOpenLink(event, true);
        openUILinkIn(link, where);
    },

    openContentLink: function Cmd_openContentLink(link, event) {
        this.openContentLinkWith(link, null, event);
    },

    // ここで Content Link とは、現在見ているページのブックマーク
    // エントリーページへのリンクのような、現在見ているページと
    // 関係のあるページへのものをさす。
    openContentLinkWith: function Cmd_openContentLinkWith(link, context, event) {
        if (!/^https?:/.test(link))
            link = HatenaLink.parseToURL(link, context);
        let where = this.whereToOpenLink(event, false);
        // タブを開かなければ UI Link も Content Link も挙動は同じ。
        if (where === 'current' || where === 'window' || where === 'save') {
            openUILinkIn(link, where);
            return;
        }
        // タブを開く場合、openUILink() を使うと、
        // browser.tabs.loadBookmarksInBackground の値を元に
        // フォーカスの有無が決められてしまう。Content Link に
        // 関しては browser.tabs.loadInBackground の値を元に
        // フォーカスの有無を決めたいので、openUILinkIn() は使わない。
        let inBackground = Prefs.global.get(CONTENT_TAB_IN_BG_PREF, false);
        if (where === 'tabshifted')
            inBackground = !inBackground;
        getTopWin().gBrowser.loadOneTab(link, null, null, null, inBackground);
    },

    whereToOpenLink: function Cmd_whereToOpenLink(event, isUILink) {
        let where = whereToOpenLink(event);
        if (where !== 'current') return where;
        where = Prefs.hatenabar.get('link.openIn', where);
        if (where !== 'tabfocused' && where !== 'tabblurred') return where;
        let inBackground = Prefs.global.get(isUILink ? UI_TAB_IN_BG_PREF
                                                     : CONTENT_TAB_IN_BG_PREF);
        let wantsFocus = (where === 'tabfocused');
        return inBackground ? (wantsFocus ? 'tabshifted' : 'tab')
                            : (wantsFocus ? 'tab' : 'tabshifted');
    },

    openPreferences: function Cmd_openPreferences() {
        let features = 'chrome,titlebar,toolbar,centerscreen,' +
                       (Prefs.global.get('browser.preferences.instantApply')
                        ? 'dialog=no' : 'modal');
        window.openDialog('chrome://hatenabar/content/preferences.xul',
                          'hatenabar-preferences', features);
    },

    goSearch: function Cmd_goSearch(query, event) {
        let link = Prefs.hatenabar.get('searchbar.link');
        let url = HatenaLink.parseToURL(link, { query: query })
        let where = this.whereToOpenLink(event, true);
        if (event instanceof Ci.nsIDOMKeyEvent) {
            // Alt + Enter で検索したときは
            // 常に新しいタブを開き、そこにフォーカス。
            where = event.altKey
                ? (Prefs.global.get('browser.tabs.loadBookmarksInBackground', false)
                   ? 'tabshifted' : 'tab')
                : Prefs.hatenabar.get('link.openIn', where);
        }
        openUILinkIn(url, where);
    },

    clearSearchHistory: function Cmd_clearSearchHistory() {
        InputHistory.searchbar.clear();
    },

    goRefer: function Cmd_goRefer(link, doc, event) {
        let cite = doc.location.href;
        let title = doc.title || '';
        let body = '';
        let win = doc.defaultView;
        if (win) {
            body = getSelectedText(win);
            if (!body) {
                for (let i = 0; i < win.frames.length; i++) {
                    body = getSelectedText(win.frames[i]);
                    if (body) break;
                }
            }
        }
        let url = HatenaLink.parseToURL(link) + '?' +
                  makeURIQuery({ cite: cite, title: title, body: body });
        this.openContentLink(url, event);

        function getSelectedText(win) {
            let text = '';
            let selection = win.getSelection();
            for (let i = 0; i < selection.rangeCount; i++)
                text += (text ? ' ' : '') + selection.getRangeAt(i).toString();
            return text;
        }
    },
};
