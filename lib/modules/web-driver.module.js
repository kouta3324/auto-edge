"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTransaction = exports.login = exports.getEdgeWebDriver = void 0;
var selenium_webdriver_1 = require("selenium-webdriver");
var util_module_1 = require("./util.module");
/** Microsoft Edge の WebDriver を取得 */
exports.getEdgeWebDriver = (function (edgeOptions) { return __awaiter(void 0, void 0, void 0, function () {
    var capabilities;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                capabilities = selenium_webdriver_1.Capabilities.edge()
                    .set('ms:edgeOptions', {
                    args: edgeOptions
                });
                return [4 /*yield*/, new selenium_webdriver_1.Builder()
                        .withCapabilities(capabilities)
                        .build()
                        .catch(function (e) {
                        throw new util_module_1.AppError('ブラウザの起動に失敗しました。', e);
                    })];
            case 1: 
            // ブラウザを起動
            return [2 /*return*/, _a.sent()];
        }
    });
}); });
/** ログイン処理 (初回のみ処理) */
exports.login = (function (driver, loginUrl, loginTransaction, timeout) { return __awaiter(void 0, void 0, void 0, function () {
    var _i, loginTransaction_1, operation;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            // ログインURLを開く
            return [4 /*yield*/, driver.get(loginUrl)
                    .catch(function (e) {
                    throw new util_module_1.AppError('ログインページへのアクセスに失敗しました。', e);
                })
                // ログイン処理データにしたがってオペレーションする
            ];
            case 1:
                // ログインURLを開く
                _a.sent();
                _i = 0, loginTransaction_1 = loginTransaction;
                _a.label = 2;
            case 2:
                if (!(_i < loginTransaction_1.length)) return [3 /*break*/, 6];
                operation = loginTransaction_1[_i];
                return [4 /*yield*/, doOperation(driver, operation, timeout)];
            case 3:
                _a.sent();
                return [4 /*yield*/, util_module_1.sleep(operation.waitAfter)];
            case 4:
                _a.sent();
                _a.label = 5;
            case 5:
                _i++;
                return [3 /*break*/, 2];
            case 6: return [2 /*return*/];
        }
    });
}); });
/** 取引処理 */
exports.runTransaction = (function (driver, startUrl, transaction, timeout) { return __awaiter(void 0, void 0, void 0, function () {
    var _i, transaction_1, operation;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            // スタートURLを開く
            return [4 /*yield*/, driver.get(startUrl)
                    .catch(function (e) {
                    throw new util_module_1.AppError('スタートページへのアクセスに失敗しました。', e);
                })
                // 取引処理データにしたがってオペレーション
            ];
            case 1:
                // スタートURLを開く
                _a.sent();
                _i = 0, transaction_1 = transaction;
                _a.label = 2;
            case 2:
                if (!(_i < transaction_1.length)) return [3 /*break*/, 6];
                operation = transaction_1[_i];
                return [4 /*yield*/, doOperation(driver, operation, timeout)];
            case 3:
                _a.sent();
                return [4 /*yield*/, util_module_1.sleep(operation.waitAfter)];
            case 4:
                _a.sent();
                _a.label = 5;
            case 5:
                _i++;
                return [3 /*break*/, 2];
            case 6: return [2 /*return*/];
        }
    });
}); });
var doOperation = (function (driver, operation, timeout) { return __awaiter(void 0, void 0, void 0, function () {
    var element, element, isSelected, alert_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(operation.control === 'click' && operation.cssSelector)) return [3 /*break*/, 2];
                return [4 /*yield*/, driver
                        .wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.css(operation.cssSelector)), timeout)
                        .click()
                        .catch(function (e) {
                        throw new util_module_1.AppError('「' + operation.label + '」列の項目「' + operation.name + '」のクリックに失敗しました。', e);
                    })];
            case 1:
                _a.sent();
                return [3 /*break*/, 7];
            case 2:
                if (!(operation.control === 'input' && operation.cssSelector)) return [3 /*break*/, 7];
                return [4 /*yield*/, driver
                        .wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.css(operation.cssSelector)), timeout)
                        .catch(function (e) {
                        throw new util_module_1.AppError('「' + operation.label + '」列の項目「' + operation.name + '」の入力に失敗しました。', e);
                    })];
            case 3:
                element = _a.sent();
                return [4 /*yield*/, element.clear()
                        .catch(function (e) {
                        throw new util_module_1.AppError('「' + operation.label + '」列の項目「' + operation.name + '」の入力値のクリアに失敗しました。', e);
                    })
                    // 「""」の場合は入力値のクリアのみ
                ];
            case 4:
                _a.sent();
                // 「""」の場合は入力値のクリアのみ
                if (operation.value === '""')
                    return [2 /*return*/];
                // 入力
                return [4 /*yield*/, element.sendKeys(operation.value)
                        .catch(function (e) {
                        throw new util_module_1.AppError('「' + operation.label + '」列の項目「' + operation.name + '」の値の入力に失敗しました。', e);
                    })
                    // 入力値確定(TAB入力)
                ];
            case 5:
                // 入力
                _a.sent();
                // 入力値確定(TAB入力)
                return [4 /*yield*/, element.sendKeys(selenium_webdriver_1.Key.TAB)
                        .catch(function (e) {
                        throw new util_module_1.AppError('「' + operation.label + '」列の項目「' + operation.name + '」の値の入力値確定に失敗しました。', e);
                    })];
            case 6:
                // 入力値確定(TAB入力)
                _a.sent();
                _a.label = 7;
            case 7:
                if (!(operation.control === 'check' && operation.cssSelector)) return [3 /*break*/, 12];
                return [4 /*yield*/, driver
                        .wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.css(operation.cssSelector)), timeout)
                        .catch(function (e) {
                        throw new util_module_1.AppError('「' + operation.label + '」列の項目「' + operation.name + '」のチェックに失敗しました。', e);
                    })];
            case 8:
                element = _a.sent();
                return [4 /*yield*/, element.isSelected()];
            case 9:
                isSelected = _a.sent();
                if (!((!isSelected && operation.value === '○') || (isSelected && operation.value === '×'))) return [3 /*break*/, 11];
                return [4 /*yield*/, element.click()
                        .catch(function (e) {
                        throw new util_module_1.AppError('「' + operation.label + '」列の項目「' + operation.name + '」のチェックに失敗しました。', e);
                    })];
            case 10:
                _a.sent();
                _a.label = 11;
            case 11: return [3 /*break*/, 22];
            case 12:
                if (!(operation.control === 'dialog')) return [3 /*break*/, 22];
                return [4 /*yield*/, driver
                        .wait(selenium_webdriver_1.until.alertIsPresent(), timeout)
                        .catch(function (e) {
                        throw new util_module_1.AppError('「' + operation.label + '」列の項目「' + operation.name + '」のダイアログ取得に失敗しました。', e);
                    })];
            case 13:
                _a.sent();
                return [4 /*yield*/, util_module_1.sleep(operation.waitAfter)];
            case 14:
                _a.sent();
                return [4 /*yield*/, driver.switchTo().alert()
                    // OK
                ];
            case 15:
                alert_1 = _a.sent();
                if (!(operation.value === 'OK')) return [3 /*break*/, 17];
                return [4 /*yield*/, alert_1.accept()
                        .catch(function (e) {
                        throw new util_module_1.AppError('「' + operation.label + '」列の項目「' + operation.name + '」のダイアログOKのクリックに失敗しました。', e);
                    })];
            case 16:
                _a.sent();
                return [3 /*break*/, 22];
            case 17:
                if (!(operation.value === 'Cancel')) return [3 /*break*/, 19];
                return [4 /*yield*/, alert_1.dismiss()
                        .catch(function (e) {
                        throw new util_module_1.AppError('「' + operation.label + '」列の項目「' + operation.name + '」のダイアログCancelのクリックに失敗しました。', e);
                    })];
            case 18:
                _a.sent();
                return [3 /*break*/, 22];
            case 19: return [4 /*yield*/, alert_1.sendKeys(operation.value)
                    .catch(function (e) {
                    throw new util_module_1.AppError('「' + operation.label + '」列の項目「' + operation.name + '」のダイアログの値の入力に失敗しました。', e);
                })];
            case 20:
                _a.sent();
                return [4 /*yield*/, alert_1.accept()
                        .catch(function (e) {
                        throw new util_module_1.AppError('「' + operation.label + '」列の項目「' + operation.name + '」のダイアログOKのクリックに失敗しました。', e);
                    })];
            case 21:
                _a.sent();
                _a.label = 22;
            case 22: return [2 /*return*/];
        }
    });
}); });
