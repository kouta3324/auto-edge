import { WorkSheet, CellObject, readFile, utils } from 'xlsx'
import { getDateAsString, notifyError } from './util.module'
import { Logger } from './logger.module'

/** XLSXファイルを開く */
export const getDataSheet = ((filePath: string, sheetName: string): WorkSheet => {
    const book = readFile(filePath, { cellDates: true })
    return book.Sheets[sheetName]
})

/** Excelワークシートから取引処理データを取得する */
export const getTransactionData = ((label: Config['data']['label'], sheet: WorkSheet)
    : Operation[][] => {

    // ラベルからカラム位置特定
    const colIndex = {
        name: 0,
        control: 1,
        cssSelector: 2,
        style: 3,
        timeout: 4,
        dataStart: Number.MAX_VALUE,
        dataMax: 0,
    }
    for (let iCol = 0; ; iCol++) {
        const cell = sheet[utils.encode_cell({ c: iCol, r: 0 })]
        if (!cell) break
        if (cell.v === label.name) {
            colIndex.name = iCol
        }
        else if (cell.v === label.control) {
            colIndex.control = iCol
        }
        else if (cell.v === label.cssSelector) {
            colIndex.cssSelector = iCol
        }
        else if (cell.v === label.style) {
            colIndex.style = iCol
        }
        else if (cell.v === label.timeout) {
            colIndex.timeout = iCol
        }
        else if (cell.v === label.data) {
            if (iCol < colIndex.dataStart) {
                colIndex.dataStart = iCol
            }
        }
        if (colIndex.dataMax < iCol) {
            colIndex.dataMax = iCol
        }
    }

    // データロード
    const data: Operation[][] = []
    // データ列を1列ずつ処理する
    for (let iCol = colIndex.dataStart; iCol <= colIndex.dataMax; iCol++) {
        const transaction: Operation[] = []

        // 項目ごとに1行ずつ処理する
        for (let iRow = 1; ; iRow++) {
            // 項目名 (指定が無い場合は当該列処理終了)
            const name = getValueString(sheet[utils.encode_cell({ c: colIndex.name, r: iRow })])
            if (!name) break
            // 操作
            const control = getValueControl(sheet[utils.encode_cell({ c: colIndex.control, r: iRow })])
            if (!control) {
                const errMsg = (iRow + 1) + '行目「' + name + '」の' + label.control + 'が指定されていないか、値が不正です。'
                notifyError(errMsg)
                throw new Error(errMsg)
            }
            // 形式
            const style = getValueStyle(sheet[utils.encode_cell({ c: colIndex.style, r: iRow })])
            if (control === 'input' && !style) {
                const errMsg = (iRow + 1) + '行目「' + name + '」の' + label.style + 'が指定されていないか、値が不正です。'
                notifyError(errMsg)
                throw new Error(errMsg)
            }
            // 値 (指定が無い場合は項目単位にスキップ)
            let value: string | undefined
            if (style === 'number') {
                value = getValueStringFromNumber(sheet[utils.encode_cell({ c: iCol, r: iRow })])
            }
            else if (style === 'date') {
                value = getValueStringFromDate(sheet[utils.encode_cell({ c: iCol, r: iRow })])
            }
            else {
                value = getValueString(sheet[utils.encode_cell({ c: iCol, r: iRow })])
            }
            if (!value) continue
            // CSSセレクタ
            const cssSelector = getValueString(sheet[utils.encode_cell({ c: colIndex.cssSelector, r: iRow })])
            if (!cssSelector) {
                const errMsg = (iRow + 1) + '行目「' + name + '」の' + label.cssSelector + 'が指定されていないか、値が不正です。'
                notifyError(errMsg)
                throw new Error(errMsg)
            }
            // タイムアウト
            const timeoutMSec = getValueNumber(sheet[utils.encode_cell({ c: colIndex.timeout, r: iRow })])
            if (!timeoutMSec) {
                const errMsg = (iRow + 1) + '行目「' + name + '」の' + label.timeout + 'が指定されていないか、値が不正です。'
                notifyError(errMsg)
                throw new Error(errMsg)
            }
            // 配列に追加
            transaction.push({
                name, control, cssSelector, style, timeoutMSec, value
            })
        }
        // 配列に追加
        data.push(transaction)
    }
    return data
})

const getValueControl = ((cell: CellObject): ItemControl | undefined => {
    if (!cell) return undefined
    if (cell.v === 'input') return 'input'
    if (cell.v === 'click') return 'click'
    Logger.debug('操作指定区分不正')
    Logger.debug(cell)
    return undefined
})
const getValueStyle = ((cell: CellObject): ItemStyle | undefined => {
    if (!cell) return undefined
    if (cell.v === 'string') return 'string'
    if (cell.v === 'number') return 'number'
    if (cell.v === 'date') return 'date'
    Logger.debug('形式指定区分不正')
    Logger.debug(cell)
    return undefined
})
const getValueString = ((cell: CellObject): string | undefined => {
    if (!cell) return undefined
    if (typeof cell.v !== 'string') {
        Logger.debug('形式不正')
        Logger.debug(cell)
        return undefined
    }
    return cell.v
})
const getValueNumber = ((cell: CellObject): number | undefined => {
    if (!cell) return undefined
    if (typeof cell.v !== 'number') {
        Logger.debug('形式不正')
        Logger.debug(cell)
        return undefined
    }
    return cell.v
})
const getValueStringFromNumber = ((cell: CellObject): string | undefined => {
    if (!cell) return undefined
    if (typeof cell.v !== 'number') {
        Logger.debug('形式不正')
        Logger.debug(cell)
        return undefined
    }
    return String(cell.v)
})
const getValueStringFromDate = ((cell: CellObject): string | undefined => {
    if (!cell) return undefined
    if (!(cell.v instanceof Date)) {
        Logger.debug('形式不正')
        Logger.debug(cell)
        return undefined
    }
    return getDateAsString(cell.v)
})