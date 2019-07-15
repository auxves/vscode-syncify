module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/main.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/main.ts":
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const init_service_1 = __webpack_require__(/*! ./services/init.service */ "./src/services/init.service.ts");
const state_1 = __webpack_require__(/*! ./state */ "./src/state.ts");
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        state_1.state.context = context;
        yield init_service_1.InitService.init();
    });
}
exports.activate = activate;


/***/ }),

/***/ "./src/models/settings.model.ts":
/*!**************************************!*\
  !*** ./src/models/settings.model.ts ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const sync_method_model_1 = __webpack_require__(/*! ./sync-method.model */ "./src/models/sync-method.model.ts");
exports.defaultSettings = {
    method: sync_method_model_1.SyncMethod.RepoService,
    state: {
        lastUpload: null
    }
};


/***/ }),

/***/ "./src/models/sync-method.model.ts":
/*!*****************************************!*\
  !*** ./src/models/sync-method.model.ts ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var SyncMethod;
(function (SyncMethod) {
    SyncMethod["RepoService"] = "repoService";
})(SyncMethod = exports.SyncMethod || (exports.SyncMethod = {}));


/***/ }),

/***/ "./src/services/factory.service.ts":
/*!*****************************************!*\
  !*** ./src/services/factory.service.ts ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const sync_method_model_1 = __webpack_require__(/*! ../models/sync-method.model */ "./src/models/sync-method.model.ts");
const repo_service_1 = __webpack_require__(/*! ./repo.service */ "./src/services/repo.service.ts");
class FactoryService {
    static generate(syncMethod) {
        return new this.methods[syncMethod]();
    }
}
FactoryService.methods = {
    [sync_method_model_1.SyncMethod.RepoService]: repo_service_1.RepoService
};
exports.FactoryService = FactoryService;


/***/ }),

/***/ "./src/services/init.service.ts":
/*!**************************************!*\
  !*** ./src/services/init.service.ts ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = __webpack_require__(/*! vscode */ "vscode");
const state_1 = __webpack_require__(/*! ../state */ "./src/state.ts");
const factory_service_1 = __webpack_require__(/*! ./factory.service */ "./src/services/factory.service.ts");
const settings_service_1 = __webpack_require__(/*! ./settings.service */ "./src/services/settings.service.ts");
class InitService {
    static init() {
        return __awaiter(this, void 0, void 0, function* () {
            state_1.state.settings = new settings_service_1.SettingsService();
            const settings = state_1.state.settings.getSettings();
            state_1.state.sync = factory_service_1.FactoryService.generate(settings.method);
            this.registerCommands();
        });
    }
    static registerCommands() {
        state_1.state.context.subscriptions.push(vscode_1.commands.registerCommand("syncify.sync", state_1.state.sync.sync.bind(state_1.state.sync)), vscode_1.commands.registerCommand("syncify.upload", state_1.state.sync.upload.bind(state_1.state.sync)), vscode_1.commands.registerCommand("syncify.download", state_1.state.sync.download.bind(state_1.state.sync)), vscode_1.commands.registerCommand("syncify.reset", state_1.state.sync.reset.bind(state_1.state.sync)));
    }
}
exports.InitService = InitService;


/***/ }),

/***/ "./src/services/repo.service.ts":
/*!**************************************!*\
  !*** ./src/services/repo.service.ts ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = __webpack_require__(/*! vscode */ "vscode");
class RepoService {
    sync() {
        return __awaiter(this, void 0, void 0, function* () {
            vscode_1.window.showInformationMessage("Syncing!");
        });
    }
    upload() {
        return __awaiter(this, void 0, void 0, function* () {
            vscode_1.window.showInformationMessage("Uploading!");
        });
    }
    download() {
        return __awaiter(this, void 0, void 0, function* () {
            vscode_1.window.showInformationMessage("Downloading!");
        });
    }
    isConfigured() {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }
    reset() {
        return __awaiter(this, void 0, void 0, function* () {
            vscode_1.window.showInformationMessage("Resetting!");
        });
    }
}
exports.RepoService = RepoService;


/***/ }),

/***/ "./src/services/settings.service.ts":
/*!******************************************!*\
  !*** ./src/services/settings.service.ts ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __webpack_require__(/*! fs */ "fs");
const path_1 = __webpack_require__(/*! path */ "path");
const settings_model_1 = __webpack_require__(/*! ../models/settings.model */ "./src/models/settings.model.ts");
const state_1 = __webpack_require__(/*! ../state */ "./src/state.ts");
class SettingsService {
    getSettings() {
        const filepath = path_1.resolve(state_1.state.context.globalStoragePath, "settings.json");
        if (!fs_1.existsSync(filepath)) {
            this.setSettings(settings_model_1.defaultSettings);
            return settings_model_1.defaultSettings;
        }
        try {
            return Object.assign({}, settings_model_1.defaultSettings, JSON.parse(fs_1.readFileSync(filepath, "utf-8")));
        }
        catch (err) {
            throw new Error(err);
        }
    }
    setSettings(settings) {
        if (!fs_1.existsSync(state_1.state.context.globalStoragePath)) {
            fs_1.mkdirSync(state_1.state.context.globalStoragePath);
        }
        const filepath = path_1.resolve(state_1.state.context.globalStoragePath, "settings.json");
        fs_1.writeFileSync(filepath, JSON.stringify(settings, null, 2));
    }
}
exports.SettingsService = SettingsService;


/***/ }),

/***/ "./src/state.ts":
/*!**********************!*\
  !*** ./src/state.ts ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.state = {};


/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("path");

/***/ }),

/***/ "vscode":
/*!*************************!*\
  !*** external "vscode" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("vscode");

/***/ })

/******/ });
//# sourceMappingURL=main.js.map