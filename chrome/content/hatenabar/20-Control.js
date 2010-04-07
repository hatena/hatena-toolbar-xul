/* ツールバー、ステータスバーなどのフォームコントロール */

const EXPORT = ['Control'];

var Control = {
    getLink: function Ctrl_getLink(node) {
        return node.getAttributeNS(HATENA_NS, 'link');
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
    },
};
