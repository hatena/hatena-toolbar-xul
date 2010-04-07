const EXPORT = ['Command'];

var Command = {
    openUILink: function Cmd_openUILink(link, event) {
        if (!/^https?:/.test(link))
            link = HatenaLink.expand(link);
        openUILink(link, event);
    },

    openPreferences: function Cmd_openPreferences() {
        p(arguments.callee.name + ': not yet implemented...');
    },

    goSearch: function Cmd_goSearch(query, event) {
        let link = HatenaLink.expand('b:search:<query>', { query: query })
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
