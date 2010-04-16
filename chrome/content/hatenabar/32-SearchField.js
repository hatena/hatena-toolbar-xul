const EXPORT = ['SearchField'];

var SearchField = {
    get inputHistory SF_get_inputHistory() InputHistory.searchbar,
    get textbox SF_get_textbox() document.getElementById('hatenabar-search-field'),

    formFillPrefs: new Prefs('browser.formfill'),

    // XXX Must be called on load and ToolboxCustomizeDone
    init: function SF_init() {
        let textbox = this.textbox;
        if (!textbox) return;
        textbox.searchParam = this.inputHistory.key;

        let inputBox = document.getAnonymousElementByAttribute(textbox, 'anonid', 'textbox-input-box');
        let contextMenu = document.getAnonymousElementByAttribute(inputBox, 'anonid', 'input-box-contextmenu');
        contextMenu.appendChild(document.createElementNS(XUL_NS, 'menuseparator'));
        let menu = document.createElementNS(XUL_NS, 'menuitem');
        menu.setAttribute('label', '{{Clear Search History}}');
        //menu.setAttribute('accesskey', '');
        menu.setAttribute('oncommand', "hatenabar.Command.clearSearchHistory();");
        contextMenu.appendChild(menu);

        //let item = textbox.parentNode;
        //if (item.nextSibling) {
        //    let splitter = document.createElementNS(XUL_NS, 'splitter');
        //    splitter.setAttribute('id', 'hatenabar-search-splitter');
        //    splitter.setAttribute('resizebefore', 'closest');
        //    splitter.setAttribute('resizeafter', 'flex');
        //    splitter.setAttribute('tooltiptext', '{{Resize Search Field}}');
        //    splitter.appendChild(document.createElementNS(XUL_NS, 'toolbarseparator'));
        //    item.parentNode.insertBefore(splitter, item.nextSibling);
        //}

        this.enableHistory();
    },

    enableHistory: function SF_enableHistory(enable) {
        let textbox = this.textbox;
        if (!textbox) return;
        if (enable === undefined)
            enable = this.formFillPrefs.get('enable', true);
        if (enable)
            textbox.setAttribute('enablehistory', 'true');
        else
            textbox.removeAttribute('enablehistory');
    },

    goSearch: function SF_goSearch(event) {
        let query = this.textbox.value;
        if (query)
            this.inputHistory.add(query);
        Command.goSearch(query, event);
    },

    onKeyPress: function SF_onKeyPress(event) {
        if (event.keyCode !== event.DOM_VK_RETURN) return;
        this.goSearch(event);
    },

    onButtonClick: function SF_onButtonClick(event) {
        if (event.button === 2) return;
        this.goSearch(event);
    },
};

Toolbar.createListener('CustomizeDone', method(SearchField, 'init'));
SearchField.formFillPrefs.createListener(
    'enable', method(SearchField, 'enableHistory', undefined));
