var index = (function () {
'use strict';
function _array_like_to_array(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_without_holes(arr) {
    if (Array.isArray(arr)) return _array_like_to_array(arr);
}
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else obj[key] = value;
    return obj;
}
function _iterable_to_array(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) {
        return Array.from(iter);
    }
}
function _non_iterable_spread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _object_spread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    else {
        ownKeys(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _to_consumable_array(arr) {
    return _array_without_holes(arr) || _iterable_to_array(arr) || _unsupported_iterable_to_array(arr) || _non_iterable_spread();
}
function _type_of(obj) {
    "@swc/helpers - typeof";
    return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
function _unsupported_iterable_to_array(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array(o, minLen);
}
var PLUGIN_ID = "unbound-fakeprofile";
var settings = window.unbound.storage.getStore(PLUGIN_ID);
var DEFAULT_PROFILE = {
    enabled: true,
    displayName: "Your display name",
    username: "your.username",
    bio: "Local fake-profile preview",
    avatarUrl: "",
    bannerUrl: "",
    accentColor: "#5865F2",
    showPreviewLabel: true,
    connections: []
};
function validHttpsUrl(value) {
    try {
        var url = new URL(value);
        return url.protocol === "https:" && !!url.hostname && !url.username && !url.password;
    } catch (unused) {
        return false;
    }
}
function readProfile() {
    var saved = settings.get("profile", {});
    var profile = _object_spread({}, DEFAULT_PROFILE, saved && (typeof saved === "undefined" ? "undefined" : _type_of(saved)) === "object" ? saved : {});
    profile.connections = Array.isArray(profile.connections) ? profile.connections.slice(0, 20).filter(function(item) {
        return item && typeof item.label === "string" && typeof item.url === "string" && validHttpsUrl(item.url);
    }) : [];
    return profile;
}
function saveProfile(next) {
    var profile = _object_spread({}, readProfile(), next);
    profile.connections = Array.isArray(profile.connections) ? profile.connections.slice(0, 20) : [];
    settings.set("profile", profile);
    return profile;
}
var index = {
    start: function start() {
        saveProfile(readProfile());
        console.info("[Fake Profile Local] Loaded local profile data.");
    },
    stop: function stop() {}
};
var FakeProfileLocal = {
    get: readProfile,
    set: saveProfile,
    reset: function reset() {
        settings.set("profile", _object_spread_props(_object_spread({}, DEFAULT_PROFILE), {
            connections: []
        }));
        return readProfile();
    },
    validateHttpsUrl: validHttpsUrl,
    addConnection: function addConnection(input) {
        var _input_label, _input_icon;
        var profile = readProfile();
        if (profile.connections.length >= 20) {
            throw new Error("You can add up to 20 custom connections.");
        }
        if (!((_input_label = input.label) === null || _input_label === void 0 ? void 0 : _input_label.trim()) || !validHttpsUrl(input.url)) {
            throw new Error("Enter a label and a valid HTTPS URL.");
        }
        var connection = {
            id: "custom-".concat(Date.now().toString(36), "-").concat(Math.random().toString(36).slice(2, 8)),
            label: input.label.trim().slice(0, 48),
            url: input.url.trim(),
            icon: ((_input_icon = input.icon) === null || _input_icon === void 0 ? void 0 : _input_icon.trim().slice(0, 64)) || "link"
        };
        return saveProfile({
            connections: _to_consumable_array(profile.connections).concat([
                connection
            ])
        }).connections;
    },
    removeConnection: function removeConnection(id) {
        var profile = readProfile();
        return saveProfile({
            connections: profile.connections.filter(function(item) {
                return item.id !== id;
            })
        });
    },
    previewModel: function previewModel() {
        var profile = readProfile();
        return _object_spread_props(_object_spread({}, profile), {
            previewLabel: "LOCAL PREVIEW — NOT YOUR DISCORD PROFILE",
            connections: profile.connections.map(function(connection) {
                return _object_spread_props(_object_spread({}, connection), {
                    custom: true,
                    localOnly: true,
                    statusLabel: "CUSTOM · LOCAL"
                });
            })
        });
    }
};
return {
  FakeProfileLocal: FakeProfileLocal,
  default: index
};
})();