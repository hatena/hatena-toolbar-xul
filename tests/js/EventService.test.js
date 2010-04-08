
let originalEventService;

function warmUp() {
    Components.utils.import('resource://hatenabar/modules/02-EventService.js');
    originalEventService = EventService;
}

function setUp() {
    EventService = {
        _listenersSet: undefined,
        __proto__: originalEventService,
    };
}

function tearDown() {
    EventService.getListeners().forEach(function (l) l.unlisten);
}

function testDispatch() {
    let result = false;
    function f() result = true;
    EventService.createListener('EventDispatched', f);
    EventService.dispatch('EventDispatched');
    assert.isTrue(result);

    let arg1 = null, arg2 = null;
    function g(a1, a2) { arg1 = a1; arg2 = a2; }
    EventService.createListener('DispatchedWithArgs', g);
    EventService.dispatch('DispatchedWithArgs', 42, 23);
    assert.equals(42, arg1);
    assert.equals(23, arg2);
}

function testGetListeners() {
    function f() {}
    function g() {}
    function h() {}

    let fl = EventService.createListener('Event1', f);
    let gl = EventService.createListener('Event1', g);
    assert.equals([fl, gl], EventService.getListeners('Event1'));
    assert.equals([], EventService.getListeners('UnknownEvent'));

    let hl = EventService.createListener('Event2', h);
    assert.equals([fl, gl], EventService.getListeners('Event1'));

    gl.unlisten();
    assert.equals([fl], EventService.getListeners('Event1'));
    assert.equals([fl, hl], EventService.getListeners());

    let listeners = EventService.getListeners('Event1');
    let gl2 = EventService.createListener('Event1', g);
    assert.equals([fl], listeners);
}

function testMultipleListener() {
    let result = [];
    EventService.createListener('AnEvent', function () result.push(1));
    EventService.createListener('AnotherEvent', function () result.push(2));
    EventService.createListener('AnEvent', function () result.push(3));
    EventService.dispatch('AnEvent');
    assert.equals([1, 3], result);
}

function testUnlistenUnmanaged() {
    let result = false;
    function f() result = true;
    let listener = EventService.createUnmanagedListener('EventDispatched', f);

    listener.unlisten();
    EventService.dispatch('EventDispatched');
    assert.isFalse(result);
}

function testUnlisten() {
    let result = false;
    function f() result = true;
    let listener = EventService.createListener('EventDispatched', f);

    listener.unlisten();
    EventService.dispatch('EventDispatched');
    assert.isFalse(result);

    listener.unlisten();
    assert.isTrue(true); // Will not throw any errors.
}

function testDOMEventListenerInterface() {
    let called = false;
    let value = 0;
    let listenerOjbect = {
        foo: 42,
        handleEvent: function () {
            called = true;
            value = this.foo;
        },
    };
    EventService.createListener('EventDispatched', listenerOjbect);
    EventService.dispatch('EventDispatched');
    assert.isTrue(called);
    assert.equals(42, value);
}

function testListenerUntil() {
    let result = false;
    function f() result = true;

    let listener = EventService.createUnmanagedListener('AnEvent', f);
    let doc = new DOMParser().parseFromString('<root/>', 'application/xml');
    listener.until(doc, 'TestEvent');
    EventService.dispatch('AnEvent');
    assert.isTrue(result);
    result = false;
    let ev = doc.createEvent('Event');
    ev.initEvent('TestEvent', true, false);
    doc.dispatchEvent(ev);
    EventService.dispatch('AnEvent');
    assert.isFalse(result);

    result = false;
    listener = EventService.createUnmanagedListener('AnEvent', f);
    listener.until(EventService, 'until-event');
    EventService.dispatch('until-event');
    EventService.dispatch('AnEvent');
    assert.isFalse(result);

    result = false;
    listener = EventService.createUnmanagedListener('AnEvent', f);
    listener.until(EventService, 'until-event-1');
    listener.until(EventService, 'until-event-2');
    EventService.dispatch('until-event-1');
    EventService.dispatch('AnEvent');
    assert.isTrue(result);
    result = false;
    EventService.dispatch('until-event-2');
    EventService.dispatch('AnEvent');
    assert.isFalse(result);
}

function testAddRemoveHook() {
    let called1 = false;
    EventService.onListenerAdded = function onAdded1(listener) {
        assert.isTrue(this === EventService);
        assert.isTrue(listener.target === EventService);
        assert.equals('event1', listener.event);
        assert.equals(1, EventService.getListeners().length);
        called1 = true;
    };
    let listener1 = EventService.createListener('event1', function () {});
    assert.isTrue(called1);

    let called2 = false;
    EventService.onListenerAdded = function onAdded2(listener) {
        assert.equals(2, EventService.getListeners().length);
        called2 = true;
    };
    let listener2 = EventService.createListener('event2', function () {});
    assert.isTrue(called2);

    let called3 = false;
    listener1.unlisten();
    EventService.onListenerRemoved = function onRemoved(listener) {
        assert.isTrue(listener === listener2);
        assert.isTrue(listener.target === EventService);
        assert.equals('event2', listener.event);
        assert.equals(0, EventService.getListeners().length);
        called3 = true;
    };
    listener2.unlisten();
    assert.isTrue(called3);
}

function testBless() {
    let dispatcher = {};
    let ret = EventService.bless(dispatcher);
    assert.isTrue(ret === dispatcher);
    assert.isFunction(dispatcher.createListener);

    let result = false;
    let listener = dispatcher.createListener('AnEvent', function () result = true);
    EventService.dispatch('AnEvent');
    assert.isFalse(result);
    dispatcher.dispatch('AnEvent');
    assert.isTrue(result);

    result = false;
    listener.unlisten();
    dispatcher.dispatch('AnEvent');
    assert.isFalse(result);
}
