/* ツールバー、ステータスバーなどのフォームコントロール */

const EXPORT = ['Control'];

var Control = {
    getLink: function Ctrl_getLink(node) {
        let link = null;
        for (; node; node = node.parentNode)
            if ((link = node.getAttributeNS(HATENA_NS, 'link'))) break;
        return link;
    },

    openLink: function Ctrl_openLink(node, event) {
        Command.openUILink(this.getLink(node), event);
    },

    checkClick: function Ctrl_checkClick(node, event) {
        if (event.eventPhase !== event.AT_TARGET) return;
        // checkForMiddleClick is defined in utilityOverlay.js.
        checkForMiddleClick(node, event);
    },

    updateLinkPopup: function Ctrl_updateLinkPopup(event) {
        let popup = event.target;
        if (popup === event.currentTarget &&
            !popup.hatenabar_listeningActivity) {
            let listener = this.menuActivityListener;
            popup.addEventListener('DOMMenuItemActive', listener, false);
            popup.addEventListener('DOMMenuItemInactive', listener, false);
            popup.hatenabar_listeningActivity = true;
        }

        let isLoggedIn = !!User.user;
        for (let menu = popup.firstChild; menu; menu = menu.nextSibling) {
            let link;
            if (menu.localName !== 'menuitem' || !(link = this.getLink(menu)))
                continue;
            if (isLoggedIn || !HatenaLink.isUserRequired(link)) {
                menu.disabled = false;
                menu.statusText = HatenaLink.expand(link);
            } else {
                menu.disabled = true;
            }
        }
    },

    menuActivityListener: function Ctrl_menuActivityListener(event) {
        let target = event.target;
        if (target.disabled || !target.statusText) return;
        let status = (event.type === 'DOMMenuItemActive')
                     ? target.statusText : '';
        window.XULBrowserWindow.setOverLink(status);
    },
};
