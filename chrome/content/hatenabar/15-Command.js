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

    clearHistory: function Cmd_clearHistory() {
        p(arguments.callee.name + ': not yet implemented...');
    },
};
