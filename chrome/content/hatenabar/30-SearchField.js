const EXPORT = ['SearchField'];

var SearchField = {
    get inputHistory SF_get_inputHistory() InputHistory.searchbar,
    get textbox SF_get_textbox() document.getElementById('hatenabar-search-field'),

    // XXX Must be called on load and ToolboxCustomizeDone
    bindInputHistory: function SF_bindInputHistory() {
        let textbox = this.textbox;
        if (!textbox) return;
        textbox.searchParam = this.inputHistory.key;
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

window.addEventListener('load', function () SearchField.bindInputHistory(), false);
