const EXPORT = ['Bookmark'];

var Bookmark = {
    add: function B_add(win) {
        if (typeof hBookmark !== 'undefined') {
            hBookmark.AddPanelManager.showPanel(win);
            return;
        }
        let doc = win.document;
        let script = doc.createElementNS(XHTML_NS, 'script');
        script.type = 'text/javascript';
        script.charset = 'utf-8';
        script.src = HatenaLink.parseToURL('b:') +
                     'js/Hatena/Bookmark/let.js?' +
                     new Date().toLocaleFormat('%Y%m%d');
        let parent = doc.getElementsByTagName('head')[0] || doc.body;
        parent.appendChild(script);
    },
};
