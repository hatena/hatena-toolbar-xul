/*
 * utils 内部では、
 * 頭に _ のついてないローカル変数はすべて EXPORT の対象となる
 */

if (nowDebug) {
    Application.console.open();
}

var EXPORT = [m for (m in new Iterator(this, true))
                if (!/^_/.test(m) && m !== "EXPORT")];
