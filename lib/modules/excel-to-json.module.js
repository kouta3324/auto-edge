"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactionData = exports.getDataSheet = void 0;
var xlsx_1 = require("xlsx");
var util_module_1 = require("./util.module");
var logger_module_1 = require("./logger.module");
/** XLSXファイルを開く */
exports.getDataSheet = (function (filePath, sheetName) {
    var book = xlsx_1.readFile(filePath, { cellDates: true });
    return book.Sheets[sheetName];
});
/** Excelワークシートから取引処理データを取得する */
exports.getTransactionData = (function (config, sheet) {
    // ラベルからカラム位置特定
    var label = config.data.label;
    var colIndex = {};
    for (var iCol = 0;; iCol++) {
        var cell = sheet[xlsx_1.utils.encode_cell({ c: iCol, r: 0 })];
        if (!cell || !cell.v)
            break;
        if (cell.v === label.name) {
            colIndex.name = iCol;
        }
        else if (cell.v === label.control) {
            colIndex.control = iCol;
        }
        else if (cell.v === label.cssSelector) {
            colIndex.cssSelector = iCol;
        }
        else if (cell.v === label.waitAfter) {
            colIndex.waitAfter = iCol;
        }
        else if (cell.v === label.style) {
            colIndex.style = iCol;
        }
        else if (cell.v.startsWith(label.data)) {
            if (!colIndex.dataStart || iCol < colIndex.dataStart) {
                colIndex.dataStart = iCol;
            }
            if (!colIndex.dataMax || colIndex.dataMax < iCol) {
                colIndex.dataMax = iCol;
            }
        }
    }
    // カラムの存在チェック
    if (colIndex.name === undefined)
        throw new util_module_1.AppError('データファイルに「' + label.name + '」列が存在しません。');
    if (colIndex.control === undefined)
        throw new util_module_1.AppError('データファイルに「' + label.control + '」列が存在しません。');
    if (colIndex.cssSelector === undefined)
        throw new util_module_1.AppError('データファイルに「' + label.cssSelector + '」列が存在しません。');
    if (colIndex.waitAfter === undefined)
        throw new util_module_1.AppError('データファイルに「' + label.waitAfter + '」列が存在しません。');
    if (colIndex.style === undefined)
        throw new util_module_1.AppError('データファイルに「' + label.style + '」列が存在しません。');
    if (colIndex.dataStart === undefined || colIndex.dataMax === undefined)
        throw new util_module_1.AppError('データファイルに「' + label.data + '」で始まる列が存在しません。');
    // データロード
    var data = [];
    // データ列を1列ずつ処理する
    for (var iCol = colIndex.dataStart; iCol <= colIndex.dataMax; iCol++) {
        // ラベルが「データ」で始まる列のみ処理する
        var labelOfColumn = getLabel(sheet[xlsx_1.utils.encode_cell({ c: iCol, r: 0 })], iCol);
        if (!labelOfColumn) {
            logger_module_1.Logger.warn((iCol + 1) + '列目は「' + label.data + '」で始まるラベルが無いため、読み取りスキップします');
            continue;
        }
        if (!labelOfColumn.startsWith(label.data)) {
            logger_module_1.Logger.warn((iCol + 1) + '列目「' + labelOfColumn + '」列は「' + label.data + '」で始まっていないため、読み取りスキップします');
            continue;
        }
        var transaction = [];
        // 項目ごとに1行ずつ処理する
        for (var iRow = 1;; iRow++) {
            // 項目名 (指定が無い場合は当該列処理終了)
            var name_1 = getName(sheet[xlsx_1.utils.encode_cell({ c: colIndex.name, r: iRow })], label, iRow);
            if (!name_1)
                break;
            // 操作 (指定が無い場合は項目単位にスキップ)
            var control = getControl(sheet[xlsx_1.utils.encode_cell({ c: colIndex.control, r: iRow })], label, name_1);
            if (!control)
                continue;
            // 形式
            var style = getStyle(sheet[xlsx_1.utils.encode_cell({ c: colIndex.style, r: iRow })], label, name_1);
            if (control === 'input' && !style) {
                throw new util_module_1.AppError((iRow + 1) + '行目「' + name_1 + '」の' + label.style + 'が指定されていないか、値が不正です。');
            }
            // 値 (指定が無い場合は項目単位にスキップ)
            var value = void 0;
            if (style === 'number') {
                value = getValueStringFromNumber(sheet[xlsx_1.utils.encode_cell({ c: iCol, r: iRow })], labelOfColumn, name_1);
            }
            else if (style === 'YYYY/MM/DD') {
                value = getValueStringFromDate(sheet[xlsx_1.utils.encode_cell({ c: iCol, r: iRow })], labelOfColumn, name_1);
            }
            else if (style === 'YYYYMMDD') {
                value = getValueStringFromDateNoSlash(sheet[xlsx_1.utils.encode_cell({ c: iCol, r: iRow })], labelOfColumn, name_1);
            }
            else {
                value = getValueStringFromString(sheet[xlsx_1.utils.encode_cell({ c: iCol, r: iRow })], labelOfColumn, name_1);
            }
            if (!value)
                continue;
            // 値チェック
            if (control === 'click' && value !== '○') {
                throw new util_module_1.AppError((iRow + 1) + '行目「' + name_1 + '」の' + label.data + 'の値が不正です。(clickの場合、○またはスペースのみ許容)');
            }
            else if (control === 'check' && value !== '○' && value !== '×') {
                throw new util_module_1.AppError((iRow + 1) + '行目「' + name_1 + '」の' + label.data + 'の値が不正です。(checkの場合、○、×またはスペースのみ許容)');
            }
            // CSSセレクタ
            var cssSelector = getCssSelector(sheet[xlsx_1.utils.encode_cell({ c: colIndex.cssSelector, r: iRow })], label, name_1);
            if (!cssSelector && control !== 'dialog') {
                throw new util_module_1.AppError((iRow + 1) + '行目「' + name_1 + '」の' + label.cssSelector + 'が指定されていないか、値が不正です。');
            }
            // 入力後待機
            var waitAfter = getWaitAfter(sheet[xlsx_1.utils.encode_cell({ c: colIndex.waitAfter, r: iRow })], label, name_1);
            if (!waitAfter) {
                waitAfter = config.webDriver.intervalMSec.afterOperation;
            }
            // 配列に追加
            transaction.push({
                label: labelOfColumn,
                name: name_1, control: control, cssSelector: cssSelector, waitAfter: waitAfter, style: style, value: value
            });
        }
        // 配列に追加
        data.push(transaction);
    }
    return data;
});
var getLabel = (function (cell, iCol) {
    if (!cell || !cell.v)
        return undefined;
    if (typeof cell.v === 'string')
        return cell.v;
    logger_module_1.Logger.debug((iCol + 1) + '列目のラベル形式不正: getLabel', cell);
    throw new util_module_1.AppError((iCol + 1) + '列目のラベル(1行目)の値が不正です(文字列ではない)');
});
var getName = (function (cell, label, iRow) {
    if (!cell || !cell.v)
        return undefined;
    if (typeof cell.v === 'string')
        return cell.v;
    logger_module_1.Logger.debug('「' + label.name + '」形式不正: getName', cell);
    throw new util_module_1.AppError((iRow + 1) + '行目の「' + label.name + '」の値が不正です(文字列ではない)');
});
var getControl = (function (cell, label, name) {
    if (!cell || !cell.v)
        return undefined;
    if (cell.v === 'input')
        return 'input';
    if (cell.v === 'click')
        return 'click';
    if (cell.v === 'check')
        return 'check';
    if (cell.v === 'dialog')
        return 'dialog';
    logger_module_1.Logger.debug('「' + label.control + '」区分不正: getControl', cell);
    throw new util_module_1.AppError('「' + name + '」の「' + label.control + '」の値が不正です(input,click,check,dialog以外が指定されている)');
});
var getStyle = (function (cell, label, name) {
    if (!cell || !cell.v)
        return undefined;
    if (cell.v === 'string')
        return 'string';
    if (cell.v === 'number')
        return 'number';
    if (cell.v === 'YYYY/MM/DD')
        return 'YYYY/MM/DD';
    if (cell.v === 'YYYYMMDD')
        return 'YYYYMMDD';
    if (cell.v === '-')
        return undefined;
    logger_module_1.Logger.debug('「' + label.style + '」区分不正: getStyle', cell);
    throw new util_module_1.AppError('「' + name + '」の「' + label.style + '」の値が不正です(string,number,YYYY/MM/DD/,YYYYMMDD,-以外が指定されている');
});
var getCssSelector = (function (cell, label, name) {
    if (!cell || !cell.v)
        return undefined;
    if (typeof cell.v === 'string')
        return cell.v;
    logger_module_1.Logger.debug('「' + label.cssSelector + '」形式不正: getCssSelector', cell);
    throw new util_module_1.AppError('「' + name + '」の「' + label.cssSelector + '」の値が不正です(文字列ではない)');
});
var getWaitAfter = (function (cell, label, name) {
    if (!cell || !cell.v)
        return undefined;
    if (typeof cell.v === 'number')
        return cell.v;
    logger_module_1.Logger.debug('「' + label.waitAfter + '」形式不正: getWaitAfter', cell);
    throw new util_module_1.AppError('「' + name + '」の「' + label.waitAfter + '」の値が不正です(数値ではない)');
});
var getValueStringFromString = (function (cell, labelOfColumn, name) {
    if (!cell || !cell.v)
        return undefined;
    if (typeof cell.v === 'string')
        return cell.v;
    if (typeof cell.v === 'number')
        return String(cell.v);
    logger_module_1.Logger.debug('「' + labelOfColumn + '」列「' + name + '」形式不正: getValueStringFromString', cell);
    throw new util_module_1.AppError('「' + labelOfColumn + '」列の「' + name + '」の値が不正です(値が文字列ではない)');
});
var getValueStringFromNumber = (function (cell, labelOfColumn, name) {
    if (!cell || !cell.v)
        return undefined;
    if (typeof cell.v === 'number')
        return String(cell.v);
    if (typeof cell.v === 'string' && cell.v === '""')
        return cell.v;
    logger_module_1.Logger.debug('「' + labelOfColumn + '」列「' + name + '」形式不正: getValueStringFromNumber', cell);
    throw new util_module_1.AppError('「' + labelOfColumn + '」列の「' + name + '」の値が不正です(値が数値ではない)');
});
var getValueStringFromDate = (function (cell, labelOfColumn, name) {
    if (!cell || !cell.v)
        return undefined;
    if ((cell.v instanceof Date))
        return util_module_1.getDateAsString(cell.v);
    if (typeof cell.v === 'string' && cell.v === '""')
        return cell.v;
    logger_module_1.Logger.debug('「' + labelOfColumn + '」列「' + name + '」形式不正: getValueStringFromDate', cell);
    throw new util_module_1.AppError('「' + labelOfColumn + '」列の「' + name + '」の値が不正です(値が日付ではない)');
});
var getValueStringFromDateNoSlash = (function (cell, labelOfColumn, name) {
    if (!cell || !cell.v)
        return undefined;
    if ((cell.v instanceof Date))
        return util_module_1.getDateAsStringNoSlash(cell.v);
    if (typeof cell.v === 'string' && cell.v === '""')
        return cell.v;
    logger_module_1.Logger.debug('「' + labelOfColumn + '」列「' + name + '」形式不正: getValueStringFromDateNoSlash', cell);
    throw new util_module_1.AppError('「' + labelOfColumn + '」列の「' + name + '」の値が不正です(値が日付ではない)');
});
