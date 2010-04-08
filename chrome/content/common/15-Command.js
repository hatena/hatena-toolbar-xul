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
        this.openContentLink(link, null, event);
    },

    openContentLinkWith: function Cmd_openContentLinkWith(link, context, event) {
        if (!/^https?:/.test(link))
            link = HatenaLink.parseToURL(link, context);
        openUILink(link, event); // XXX 適切な動作を。
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
};
