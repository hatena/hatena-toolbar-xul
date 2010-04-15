const EXPORT = ['UICommand'];

var UICommand = {
    openLink: function UIC_openLink(event) {
        Command.openUILink(this.getLink(event), event);
    },

    openRelatedLink: function UIC_openRelatedLink(event) {
        let context = { url: content.location.href };
        Command.openContentLinkWith(this.getLink(event), context, event);
    },

    openTopOrUserLink: function UIC_openTopOrUserLink(event) {
        let link = this.getLink(event);
        if (!User.user)
            link = link.replace(/:.*/, ':');
        else if (link.indexOf(':id:') === -1)
            link = link.replace(/:?$/, ':id:' + User.user.name);
        Command.openUILink(link, event);
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

    userRequiredComands: [
        'hatenabar-has-user',
        'hatenabar-cmd-open-user-link',
        'hatenabar-cmd-open-related-user-link',
        'hatenabar-cmd-add-bookmark',
        'hatenabar-cmd-refer-in-diary',
    ],
    _prevUserListener: null,

    onUserChanged: function UIC_onUserChanged() {
        let isLogin = !!User.user;
        this.userRequiredComands.forEach(function (id) {
            let command = document.getElementById(id);
            if (isLogin)
                command.removeAttribute('disabled');
            else
                command.setAttribute('disabled', 'true');
        });

        if (this._prevUserListener) {
            this._prevUserListener.unlisten();
            this._prevUserListener = null;
        }
        let groupChanged = method(this, 'onSelectedGroupChanged');
        if (isLogin) {
            this._prevUserListener =
                User.user.prefs.createListener('group.selected', groupChanged);
        }
        groupChanged();
    },

    onSelectedGroupChanged: function UIC_onSelectedGroupChanged() {
        let command = document.getElementById('hatenabar-cmd-refer-in-group');
        if (User.user && User.user.prefs.get('group.selected', ''))
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
