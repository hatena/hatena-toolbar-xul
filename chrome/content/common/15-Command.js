const EXPORT = ['Command'];

var Command = {
    openUILink: function Cmd_openUILink(link, event) {
        this.openUILinkWith(link, null, event);
    },

    openUILinkWith: function Cmd_openUILinkWith(link, context, event) {
        if (!/^https?:/.test(link))
            link = HatenaLink.parseToURL(link, context);
        openUILink(link, event);
    },

    openContentLink: function Cmd_openContentLink(link, event) {
        this.openContentLinkWith(link, null, event);
    },

    openContentLinkWith: function Cmd_openContentLinkWith(link, context, event) {
        if (!/^https?:/.test(link))
            link = HatenaLink.parseToURL(link, context);
        // XXX タブの親子関係を設定するなどの必要あり。
        openUILink(link, event); 
    },

    openPreferences: function Cmd_openPreferences() {
        p(arguments.callee.name + ': not yet implemented...');
    },

    goSearch: function Cmd_goSearch(query, event) {
        let link = HatenaLink.parseToURL('b:search', { query: query })
        if (event instanceof Ci.nsIDOMKeyEvent) {
            let newEvent = { shiftKey: false, ctrlKey: false,
                             metaKey: false, altKey: false, button: 0 };
            // Alt + Enter で検索したときは常に新しいタブを開き、
            // そこにフォーカス。
            if (event.altKey) {
                newEvent.ctrlKey = newEvent.metaKey = true;
                if (Prefs.global.get('browser.tabs.loadBookmarksInBackground'))
                    newEvent.shiftKey = true;
            }
            event = newEvent;
        }
        openUILink(link, event);
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
