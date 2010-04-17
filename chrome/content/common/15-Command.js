const EXPORT = ['Command'];

var Command = {
    openUILink: function Cmd_openUILink(link, event) {
        this.openUILinkWith(link, null, event);
    },

    // ここで UI Link とは、はてなのヘルプページへのリンクのような、
    // 現在見ているページとは無関係のページへのものをさす。
    openUILinkWith: function Cmd_openUILinkWith(link, context, event) {
        if (!/^https?:/.test(link))
            link = HatenaLink.parseToURL(link, context);
        openUILink(link, event);
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
        let where = whereToOpenLink(event);
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
        let inBackground =
            Prefs.global.get('browser.tabs.loadInBackground', false);
        if (where === 'tabshifted')
            inBackground = !inBackground;
        getTopWin().gBrowser.loadOneTab(link, null, null, null, inBackground);
    },

    openPreferences: function Cmd_openPreferences() {
        p(arguments.callee.name + ': not yet implemented...');
    },

    goSearch: function Cmd_goSearch(query, event) {
        let link = HatenaLink.parseToURL('b:search', { query: query })
        let where = whereToOpenLink(event);
        if (event instanceof Ci.nsIDOMKeyEvent) {
            // Alt + Enter で検索したときは
            // 常に新しいタブを開き、そこにフォーカス。
            where = event.altKey
                ? (Prefs.global.get('browser.tabs.loadBookmarksInBackground', false)
                   ? 'tabshifted' : 'tab')
                : 'current';
        }
        openUILinkIn(link, where);
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
