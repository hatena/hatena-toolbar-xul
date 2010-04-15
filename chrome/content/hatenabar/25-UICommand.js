const EXPORT = ['UICommand'];

var UICommand = {
    userRequiredComands: [
        'hatenabar-has-user',
        'hatenabar-cmd-open-user-link',
        'hatenabar-cmd-open-related-user-link',
    ],

    enableUserRequiredCommands: function UIC_enableUserRequiredCommands() {
        let disabled = !User.user;
        this.userRequiredComands.forEach(function (id) {
            let command = document.getElementById(id);
            if (!command) return;
            if (disabled)
                command.setAttribute('disabled', 'true');
            else
                command.removeAttribute('disabled');
        });
    },

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
};

EventService.createListener('UserChanged',
                            method(UICommand, 'enableUserRequiredCommands'));
doOnLoad(method(UICommand, 'enableUserRequiredCommands'));
