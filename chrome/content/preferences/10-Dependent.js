const EXPORT = ['Dependent'];

var Dependent = {
    map: {
        'account.showStatus': [
            'account.rememberHistory',
            'account.reloadOnChange'
        ],
    },

    init: function Dpd_init() {
        for (let id in new Iterator(this.map, true))
            this.inherit(byId(id));
    },

    inherit: function Dpd_inherit(master) {
        if (!(master.id in this.map)) return;
        let disabled = !master.value;
        this.map[master.id].forEach(function (id) byId(id).disabled = disabled);
    },

    handleEvent: function Dpd_handleEvent(event) {
        switch (event.type) {
        case 'change':
            if (event.target.localName !== 'preference') break;
            this.inherit(event.target);
            break;
        }
    },
};

document.addEventListener('change', Dependent, false);
doOnLoad(method(Dependent, 'init'));
