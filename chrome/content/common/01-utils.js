
/*
 * utils 内部では、
 * 頭に _ のついてないローカル変数はすべて EXPORT の対象となる
 */

// EventService.createListener() が束縛された関数に対しても期待通り動くよう、
// ここ (特定のウィンドウのコンテキスト) で bind と method を再定義する。
function bind(func, self) {
    let args = Array.slice(arguments, 2);
    return function () func.apply(self, args.concat(Array.slice(arguments)));
}
function method(self, methodName) {
    let args = Array.slice(arguments, 2);
    return function () self[methodName].apply(self, args.concat(Array.slice(arguments)));
}

function byId(id) document.getElementById(id);
function byClass(className, context)
    (context || document).getElementsByClassName(className);

function doOnLoad(f) window.addEventListener('load', f, false);
function doOnUnload(f) window.addEventListener('unload', f, false);

var EXPORT = [m for (m in new Iterator(this, true))
                          if (m[0] !== "_" && m !== "EXPORT")];
