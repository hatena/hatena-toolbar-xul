Components.utils.import('resource://hatenabar/modules/00-core.js');

const EXPORTED_SYMBOLS = ["EventService"];

/* var l = EventService.createListener("DataUpdated", function () { ... });
 *
 * var eventHandler = {
 *     handleEvent: function (data) {
 *         alert(data);
 *     }
 * };
 * var l = EventService.createListener("DataUpdated", eventHandler);
 * EventService.dispatch("DataUpdated", theData);
 *
 * l.unlisten();
 */

var EventServicePrototype = {
    createUnmanagedListener: function EvtSvc_createUnmanagedListener(event, handler) {
        let listenersSet = this._listenersSet || (this._listenersSet = {});
        let listeners = listenersSet[event] || (listenersSet[event] = []);
        if (typeof handler.handleEvent === 'function')
            handler = method(handler, 'handleEvent');
        return new Listener(this, event, handler);
    },

    createListener: function EvtSvc_createListener(event, handler) {
        let listener = this.createUnmanagedListener(event, handler);
        let global = getGlobalObject(handler);
        let master = global.addEventListener ? global : EventService;
        listener.until(master, 'unload');
        return listener;
    },

    dispatch: function EvtSvc_dispatch(event) {
        let args = Array.slice(arguments, 1);
        this.getListeners(event).forEach(function (listener) {
            try {
                listener.handler.apply(listener, args);
            } catch (ex) {
                reportError(ex);
            }
        });
    },

    getListeners: function EvtSvc_getListeners(event) {
        let listenersSet = this._listenersSet;
        if (!listenersSet) return [];
        if (!arguments.length) {
            let listeners = [];
            for (let event in listenersSet)
                listeners = listeners.concat(listenersSet[event]);
            return listeners;
        }
        return (listenersSet[event] || []).concat();
    },
};


function Listener(target, event, handler) {
    this.target = target;
    this.event = event;
    this.handler = handler;
    this.canceler = null;
    this.target._listenersSet[this.event].push(this);
    if (typeof this.target.onListenerAdded === 'function') {
        try {
            this.target.onListenerAdded(this);
        } catch (ex) {
            reportError(ex);
        }
    }
}

extend(Listener.prototype, {
    unlisten: function Listener_unlisten() {
        if (!this.target) return;
        let listeners = this.target._listenersSet[this.event];
        listeners.splice(listeners.indexOf(this), 1);
        if (typeof this.target.onListenerRemoved === 'function') {
            try {
                this.target.onListenerRemoved(this);
            } catch (ex) {
                reportError(ex);
            }
        }
        if (this.canceler)
            this.canceler();
        this.target = this.event = this.handler = this.canceler = null;
    },

    until: function Listener_until(target, event) {
        if (!this.target) return;
        let canceler = null;
        let unlisten = method(this, 'unlisten');
        if (target.addEventListener ||
            target instanceof Ci.nsIDOMEventListener) {
            target.addEventListener(event, unlisten, false);
            canceler = method(target, 'removeEventListener',
                              event, unlisten, false);
        } else if (target.createUnmanagedListener) {
            let listener = target.createUnmanagedListener(event, unlisten);
            canceler = method(listener, 'unlisten');
        } else if (target instanceof Ci.nsIObserverService) {
            let observer = { observe: unlisten };
            target.addObserver(observer, event, false);
            canceler = method(target, 'removeObserver', observer, event);
        } else {
            throw new Error('target is of unknown type: ' + target);
        }
        if (this.canceler)
            this.canceler();
        this.canceler = canceler;
    },
});


const QUIT_APPLICATION = 'quit-application';

var EventService = {
    __proto__: EventServicePrototype,

    bless: function EvtSvc_s_bless(object) {
        return extend(object, EventServicePrototype);
    },

    observe: function EvtSvc_s_observe(subject, topic, data) {
        if (topic === QUIT_APPLICATION) {
            this.dispatch('unload');
            ObserverService.removeObserver(this, topic);
        }
    },

    implement: function EvtSvc_s_implement(target) {
        p('EventService.implement() is deprecated.\n' +
          'Use EventService.bless instead.');
        return this.bless(target);
    },
};

ObserverService.addObserver(EventService, QUIT_APPLICATION, false);
