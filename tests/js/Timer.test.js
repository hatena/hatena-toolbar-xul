Components.utils.import('resource://hatenabar/modules/04-Timer.js');

function testTimer() {
    let timer = new Timer(1000, 3);
    let values = [1, 2, 3];
    let listeners = [
        timer.createListener('timer', function () results.push(values.shift())),
        timer.createListener('timerComplete', function () results.push(42)),
    ];
    let results = [];
    timer.start();
    assert.equals([], results);
    yield 500;
    assert.equals([], results);
    yield 1000;
    assert.equals([1], results);
    yield 1000;
    assert.equals([1, 2], results);
    yield 1000;
    assert.equals([1, 2, 3, 42], results);
    yield 1000;
    assert.equals([1, 2, 3, 42], results);
    listeners.forEach(function (l) l.unlisten());
}

function testUnlimitedTimer() {
    let timer = new Timer(500);
    let values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let listener = timer.createListener('timer', function () results.push(values.shift()));
    let results = [];
    timer.start();
    yield 2250;
    assert.equals([1, 2, 3, 4], results);
}

function testStop() {
    let timer = new Timer(1000, 3);
    let values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let complete = { value: false };
    let listeners = [
        timer.createListener('timer', function () results.push(values.shift())),
        timer.createListener('timerComplete', function () complete.value = true),
    ];
    let results = [];
    timer.start();
    yield 1500;
    assert.isTrue(timer.isRunning);
    timer.stop();
    assert.isFalse(timer.isRunning);
    assert.equals([1], results);
    yield 1000;
    assert.equals([1], results);
    timer.start();
    yield complete;
    assert.equals([1, 2, 3], results);
    listeners.forEach(function (l) l.unlisten());
}

function testReset() {
    let timer = new Timer(1000, 3);
    let values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let complete = { value: false };
    let listeners = [
        timer.createListener('timer', function () results.push(values.shift())),
        timer.createListener('timerComplete', function () complete.value = true),
    ];
    let results = [];
    timer.start();
    yield 1500;
    timer.reset();
    assert.equals([1], results);
    yield 1000;
    assert.equals([1], results);
    timer.start();
    yield complete;
    assert.equals([1, 2, 3, 4], results);
    listeners.forEach(function (l) l.unlisten());
}
