Components.utils.import('resource://hatenabar/modules/00-core.js');
loadPrecedingModules.call(this);

const EXPORTED_SYMBOLS = ['Timer'];

function Timer(interval, repeatCount) {
    this.interval = interval || 60;
    this.repeatCount = repeatCount || Infinity;
    this.currentCount = 0;
    this.timer = null;
}

EventService.bless(Timer.prototype);

extend(Timer.prototype, {
    get isRunning() !!this.timer,

    start: function Timer_start() {
        if (this.timer) return;
        this.timer = new NativeTimer(this, this.interval,
                                     Ci.nsITimer.TYPE_REPEATING_PRECISE);
    },

    stop: function Timer_stop() {
        if (!this.timer) return;
        this.timer.cancel();
        this.timer = null;
    },

    reset: function Timer_reset() {
        this.stop();
        this.currentCount = 0;
    },

    dispose: function Timer_dispose() {
        this.stop();
        this.getListeners().forEach(function (l) l.unlisten());
    },

    observe: function Timer_observe(subject, topic, data) {
        this.currentCount++;
        this.dispatch('timer');
        if (this.currentCount >= this.repeatCount) {
            this.stop();
            this.dispatch('timerComplete');
        }
    },
});
