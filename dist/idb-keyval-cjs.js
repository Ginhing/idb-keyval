'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var Store = /** @class */ (function () {
    function Store(dbName, storeName) {
        if (dbName === void 0) { dbName = 'keyval-store'; }
        if (storeName === void 0) { storeName = 'keyval'; }
        this.storeName = storeName;
        this._dbp = new Promise(function (resolve, reject) {
            var openreq = indexedDB.open(dbName, 1);
            openreq.onerror = function () { return reject(openreq.error); };
            openreq.onsuccess = function () { return resolve(openreq.result); };
            // First time setup: create an empty object store
            openreq.onupgradeneeded = function () {
                openreq.result.createObjectStore(storeName);
            };
        });
    }
    Store.prototype._withIDBStore = function (type, callback) {
        var _this = this;
        var original = this._dbp.then(function (db) { return new Promise(function (resolve, reject) {
            var transaction = db.transaction(_this.storeName, type);
            transaction.oncomplete = function () { return resolve(); };
            transaction.onabort = transaction.onerror = function () { return reject(transaction.error); };
            callback(transaction.objectStore(_this.storeName));
        }); });
        return Promise.race([original, new Promise(function (rs, rj) { return setTimeout(function () {
                rj(new Error('idb init failed.'));
            }, 5e3); })]);
    };
    return Store;
}());
var store;
function getDefaultStore() {
    if (!store)
        store = new Store();
    return store;
}
function get(key, store) {
    if (store === void 0) { store = getDefaultStore(); }
    var req;
    return store._withIDBStore('readonly', function (store) {
        req = store.get(key);
    }).then(function () { return req.result; });
}
function set(key, value, store) {
    if (store === void 0) { store = getDefaultStore(); }
    return store._withIDBStore('readwrite', function (store) {
        store.put(value, key);
    });
}
function del(key, store) {
    if (store === void 0) { store = getDefaultStore(); }
    return store._withIDBStore('readwrite', function (store) {
        store.delete(key);
    });
}
function clear(store) {
    if (store === void 0) { store = getDefaultStore(); }
    return store._withIDBStore('readwrite', function (store) {
        store.clear();
    });
}
function keys(store) {
    if (store === void 0) { store = getDefaultStore(); }
    var keys = [];
    return store._withIDBStore('readonly', function (store) {
        // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
        // And openKeyCursor isn't supported by Safari.
        (store.openKeyCursor || store.openCursor).call(store).onsuccess = function () {
            if (!this.result)
                return;
            keys.push(this.result.key);
            this.result.continue();
        };
    }).then(function () { return keys; });
}

exports.Store = Store;
exports.get = get;
exports.set = set;
exports.del = del;
exports.clear = clear;
exports.keys = keys;
