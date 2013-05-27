const EXPORT = ['UICommand'];

var UICommand = {
    openLink: function UIC_openLink(event, link) {
        Command.openUILink(link || this.getLink(event), event);
    },

    openRelatedLink: function UIC_openRelatedLink(event, link) {
        link = link || this.getLink(event);
        let context = { url: content.location.href };
        Command.openContentLinkWith(link, context, event);
    },

    openTopOrUserLink: function UIC_openTopOrUserLink(event) {
        let link = this.getLink(event);
        if (!User.user)
            link = link.replace(/:.*/, ':');
        else if (link.indexOf(':id:') === -1)
            link = link.replace(/:?$/, ':id:' + User.user.name);
        Command.openUILink(link, event);
    },

    openUserMainBlogOrBlogTop: function UIC_openUserMainBlogOrBlogTop(evt) {
        let link = (User.user ? "blog:id:" + User.user.name
                              : "http://hatenablog.com/");
        Command.openUILink(link, evt);
    },

    addOrViewBookmark: function UIC_addOrViewBookmark(event) {
        if (event.button === 0 || event.button === 1)
            Bookmark.add(content);
        else
            this.openRelatedLink(event);
    },

    getLink: function UIC_getLink(event) {
        for (let node = this.getTarget(event); node; node = node.parentNode) {
            let link = node.getAttributeNS(HATENA_NS, 'link');
            if (link)
                return link;
        }
        return null;
    },

    getTarget: function UIC_getTarget(event) {
        return (event instanceof Ci.nsIDOMXULCommandEvent &&
                event.target.localName === 'command' &&
                event.sourceEvent)
               ? event.sourceEvent.target : event.target;
    },

    updateClearSearchHistory: function UIC_updateClearSearchHistory() {
        let command = document.getElementById('hatenabar-cmd-clear-search-history');
        if (InputHistory.searchbar.hasAny())
            command.removeAttribute('disabled');
        else
            command.setAttribute('disabled', 'true');
    },

    userRequiredComands: [
        'hatenabar-cmd-open-user-link',
        'hatenabar-cmd-open-related-user-link',
        'hatenabar-cmd-open-antenna',
        'hatenabar-cmd-add-antenna',
        'hatenabar-cmd-add-bookmark',
        'hatenabar-cmd-refer-in-diary',
        'hatenabar-cmd-refer-in-group',
    ],
    _prevUserListener: null,

    onUserChanged: function UIC_onUserChanged() {
        let user = Account.user;
        this.userRequiredComands.forEach(function (id) {
            let command = document.getElementById(id);
            if (user)
                command.removeAttribute('disabled');
            else
                command.setAttribute('disabled', 'true');
        });

        if (this._prevUserListener) {
            this._prevUserListener.unlisten();
            this._prevUserListener = null;
        }
        let groupSelected = method(this, 'onGroupSelected');
        if (user) {
            this._prevUserListener =
                user.createListener('GroupSelected', groupSelected);
        }
        groupSelected();
    },

    onGroupSelected: function UIC_onGroupSelected() {
        let command = byId('hatenabar-cmd-refer-in-selected-group');
        if (Account.user && Account.user.selectedGroup)
            command.removeAttribute('disabled');
        else
            command.setAttribute('disabled', 'true');
    },
};

doOnLoad(function () {
    let userChanged = method(UICommand, 'onUserChanged');
    EventService.createListener('UserChanged', userChanged);
    userChanged();
});
