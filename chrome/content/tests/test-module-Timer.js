(function () {

/**
 * modules/04-Timer.js のテスト
 */

var modules = {};

Components.utils.import("resource://hatenabar/modules/04-Timer.js", modules);

QUnit.module("Timer");

QUnit.asyncTest("200 ms 周期で 3 回繰り返すタイマー (テスト時間約 1 s)", 6, function () {
    var pOrder = [];

    var timer = new modules.Timer(200, 3);
    var values = [1, 2, 3, "NG"];
    var listeners = [
        timer.createListener("timer", function () { pOrder.push(values.shift()) }),
        timer.createListener("timerComplete", function () { pOrder.push(4) }),
    ];

    timer.start();
    deepEqual(pOrder, []);

    setTimeout(function () {
        deepEqual(pOrder, []);
    }, 100);
    setTimeout(function () {
        deepEqual(pOrder, [1]);
    }, 300);
    setTimeout(function () {
        deepEqual(pOrder, [1,2]);
    }, 500);
    setTimeout(function () {
        deepEqual(pOrder, [1,2,3,4]);
    }, 700);
    setTimeout(function () {
        deepEqual(pOrder, [1,2,3,4]);
        listeners.forEach(function (l) { l.unlisten() });

        QUnit.start();
    }, 900);
});

QUnit.asyncTest("50 ms 周期で何度も繰り返すタイマー (テスト時間約 1 s)", 2, function () {
    var timer = new modules.Timer(50);
    var counter = 0;
    var listener = timer.createListener("timer", function () { counter++; });
    timer.start();

    setTimeout(function () {
        ok(counter >= 10, "600 ms 後には 10 回以上呼び出されているはず");
        ok(counter <= 15, "とはいえ呼びだされすぎていても良くないので確認");

        timer.stop();
        QUnit.start();
    }, 600);
});

QUnit.asyncTest("`stop` メソッドによる中断 (テスト時間約 1 s)", 5, function () {
    var pOrder = [];

    var timer = new modules.Timer(200, 3);
    var values = [1, 2, 3, "NG"];
    var listeners = [
        timer.createListener('timer', function () { pOrder.push(values.shift()) }),
        timer.createListener('timerComplete', function () { onComplete() }),
    ];
    timer.start();
    setTimeout(function () {
        ok(timer.isRunning);
        timer.stop();
        ok(!timer.isRunning);
        deepEqual(pOrder, [1]);
    }, 250);
    setTimeout(function () {
        deepEqual(pOrder, [1], "中断したタイマーは動かない");
        timer.start();
    }, 500);
    function onComplete() {
        deepEqual(pOrder, [1, 2, 3], "中断したタイマーを `start` すると続きから再開される");
        listeners.forEach(function (l) l.unlisten());

        QUnit.start();
    }
});

QUnit.asyncTest("`reset` メソッドによるリセット (テスト時間約 1 s)", 3, function () {
    var pOrder = [];

    var timer = new modules.Timer(200, 3);
    var values = [1, 2, 3, 4, "NG"];
    var listeners = [
        timer.createListener('timer', function () pOrder.push(values.shift())),
        timer.createListener('timerComplete', function () onComplete()),
    ];
    timer.start();
    setTimeout(function () {
        timer.reset();
        deepEqual(pOrder, [1]);
    }, 250);
    setTimeout(function () {
        deepEqual(pOrder, [1]);
        timer.start();
    }, 500);
    function onComplete() {
        deepEqual(pOrder, [1, 2, 3, 4], "リセットされたタイマーを `start` すると最初からやり直し");
        listeners.forEach(function (l) l.unlisten());

        QUnit.start();
    }
});

}).call(this);
