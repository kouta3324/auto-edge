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
var jsonc_parser_1 = require("jsonc-parser");
var fs_1 = require("fs");
var logger_module_1 = require("./modules/logger.module");
var util_module_1 = require("./modules/util.module");
var excel_to_json_module_1 = require("./modules/excel-to-json.module");
var web_driver_module_1 = require("./modules/web-driver.module");
var main = (function () { return __awaiter(void 0, void 0, void 0, function () {
    var config, urlInfo, loginTransaction, sheet, data, driver, _i, data_1, transaction, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                config = jsonc_parser_1.parse(fs_1.readFileSync('./config.jsonc').toString());
                // ファイルチェック
                checkFiles(config);
                urlInfo = jsonc_parser_1.parse(fs_1.readFileSync(config.siteInfo.urlFilePath).toString());
                loginTransaction = jsonc_parser_1.parse(fs_1.readFileSync(config.siteInfo.loginFilePath).toString());
                sheet = excel_to_json_module_1.getDataSheet(config.data.filePath, config.data.sheetName);
                data = excel_to_json_module_1.getTransactionData(config, sheet);
                return [4 /*yield*/, web_driver_module_1.getEdgeWebDriver(config.webDriver.edgeOptions)
                    // ログイン処理
                ];
            case 1:
                driver = _b.sent();
                // ログイン処理
                logger_module_1.Logger.info(loginTransaction);
                return [4 /*yield*/, web_driver_module_1.login(driver, urlInfo.loginUrl, loginTransaction, config.webDriver.timeoutMSec)];
            case 2:
                _b.sent();
                return [4 /*yield*/, util_module_1.sleep(config.webDriver.intervalMSec.afterLogin)
                    // 取引処理
                ];
            case 3:
                _b.sent();
                // 取引処理
                logger_module_1.Logger.info(data);
                _i = 0, data_1 = data;
                _b.label = 4;
            case 4:
                if (!(_i < data_1.length)) return [3 /*break*/, 8];
                transaction = data_1[_i];
                return [4 /*yield*/, web_driver_module_1.runTransaction(driver, urlInfo.startUrl, transaction, config.webDriver.timeoutMSec)];
            case 5:
                _b.sent();
                return [4 /*yield*/, util_module_1.sleep(config.webDriver.intervalMSec.afterTransaction)];
            case 6:
                _b.sent();
                _b.label = 7;
            case 7:
                _i++;
                return [3 /*break*/, 4];
            case 8:
                if (!driver) return [3 /*break*/, 12];
                // ブラウザ終了
                _a = driver;
                if (!_a) 
                // ブラウザ終了
                return [3 /*break*/, 10];
                return [4 /*yield*/, driver.quit()];
            case 9:
                _a = (_b.sent());
                _b.label = 10;
            case 10:
                // ブラウザ終了
                _a;
                return [4 /*yield*/, util_module_1.sleep(config.webDriver.intervalMSec.afterQuit)];
            case 11:
                _b.sent();
                _b.label = 12;
            case 12:
                // 完了通知
                util_module_1.notifyComplete(data.length + '件 処理完了しました。');
                return [2 /*return*/];
        }
    });
}); });
var checkFiles = (function (config) {
    var fileName, filePath;
    if (!fs_1.existsSync(config.siteInfo.urlFilePath)) {
        fileName = 'URL情報ファイル';
        filePath = config.siteInfo.urlFilePath;
    }
    else if (!fs_1.existsSync(config.siteInfo.loginFilePath)) {
        fileName = 'ログイン操作情報';
        filePath = config.siteInfo.loginFilePath;
    }
    else if (!fs_1.existsSync(config.data.filePath)) {
        fileName = '実行データ';
        filePath = config.data.filePath;
    }
    else {
        return;
    }
    throw new Error(fileName + ' ファイル (' + filePath + ') が存在しません。');
});
// 起動ポイント
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                logger_module_1.Logger.init();
                return [4 /*yield*/, main()];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                e_1 = _a.sent();
                if (e_1 instanceof Error) {
                    util_module_1.notifyError(e_1.message);
                }
                else {
                    util_module_1.notifyError('予期しないエラーが発生しました。(' + e_1 + ')');
                }
                logger_module_1.Logger.error(e_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); })();
