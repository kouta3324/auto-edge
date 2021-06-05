import { WorkSheet, CellObject, readFile, utils } from 'xlsx'
import { AppError, getDateAsString, getDateAsStringNoSlash } from './util.module'
import { Logger } from './logger.module'

/** XLSXファイルを開く */
export const getDataSheet = ((filePath: string, sheetName: string): WorkSheet => {
    const book = readFile(filePath, { cellDates: true })
    return book.Sheets[sheetName]
})

/** Excelワークシートから取引処理データを取得する */
export const getTransactionData = ((config: Config, sheet: WorkSheet)
    : Operation[][] => {

    // ラベルからカラム位置特定
    const label = config.data.label
    const colIndex: ColumnIndex = {}
    for (let iCol = 0; ; iCol++) {
        const cell = sheet[utils.encode_cell({ c: iCol, r: 0 })]
        if (!cell || !cell.v) break
        if (cell.v === label.name) {
            colIndex.name = iCol
        }
        else if (cell.v === label.control) {
            colIndex.control = iCol
        }
        else if (cell.v === label.cssSelector) {
            colIndex.cssSelector = iCol
        }
        else if (cell.v === label.waitAfter) {
            colIndex.waitAfter = iCol
        }
        else if (cell.v === label.style) {
            colIndex.style = iCol
        }
        else if (cell.v.startsWith(label.data)) {
            if (!colIndex.dataStart || iCol < colIndex.dataStart) {
                colIndex.dataStart = iCol
            }
            if (!colIndex.dataMax || colIndex.dataMax < iCol) {
                colIndex.dataMax = iCol
            }
        }
    }
    // カラムの存在チェック
    if (colIndex.name === undefined) throw new AppError('データファイルに「' + label.name + '」列が存在しません。')
    if (colIndex.control === undefined) throw new AppError('データファイルに「' + label.control + '」列が存在しません。')
    if (colIndex.cssSelector === undefined) throw new AppError('データファイルに「' + label.cssSelector + '」列が存在しません。')
    if (colIndex.waitAfter === undefined) throw new AppError('データファイルに「' + label.waitAfter + '」列が存在しません。')
    if (colIndex.style === undefined) throw new AppError('データファイルに「' + label.style + '」列が存在しません。')
    if (colIndex.dataStart === undefined || colIndex.dataMax === undefined) throw new AppError('データファイルに「' + label.data + '」で始まる列が存在しません。')

    // データロード
    const data: Operation[][] = []
    // データ列を1列ずつ処理する
    for (let iCol = colIndex.dataStart; iCol <= colIndex.dataMax; iCol++) {
        // ラベルが「データ」で始まる列のみ処理する
        const labelOfColumn = getLabel(sheet[utils.encode_cell({ c: iCol, r: 0 })], iCol)
        if (!labelOfColumn) {
            Logger.warn((iCol + 1) + '列目は「' + label.data + '」で始まるラベルが無いため、読み取りスキップします')
            continue
        }
        if (!labelOfColumn.startsWith(label.data)) {
            Logger.warn((iCol + 1) + '列目「' + labelOfColumn + '」列は「' + label.data + '」で始まっていないため、読み取りスキップします')
            continue
        }

        const transaction: Operation[] = []
        // 項目ごとに1行ずつ処理する
        for (let iRow = 1; ; iRow++) {
            // 項目名 (指定が無い場合は当該列処理終了)
            const name = getName(sheet[utils.encode_cell({ c: colIndex.name, r: iRow })], label, iRow)
            if (!name) break
            // 操作 (指定が無い場合は項目単位にスキップ)
            const control = getControl(sheet[utils.encode_cell({ c: colIndex.control, r: iRow })], label, name)
            if (!control) continue
            // 形式
            const style = getStyle(sheet[utils.encode_cell({ c: colIndex.style, r: iRow })], label, name)
            if (control === 'input' && !style) {
                throw new AppError((iRow + 1) + '行目「' + name + '」の' + label.style + 'が指定されていないか、値が不正です。')
            }
            // 値 (指定が無い場合は項目単位にスキップ)
            let value: string | undefined
            if (style === 'number') {
                value = getValueStringFromNumber(sheet[utils.encode_cell({ c: iCol, r: iRow })], labelOfColumn, name)
            }
            else if (style === 'YYYY/MM/DD') {
                value = getValueStringFromDate(sheet[utils.encode_cell({ c: iCol, r: iRow })], labelOfColumn, name)
            }
            else if (style === 'YYYYMMDD') {
                value = getValueStringFromDateNoSlash(sheet[utils.encode_cell({ c: iCol, r: iRow })], labelOfColumn, name)
            }
            else {
                value = getValueStringFromString(sheet[utils.encode_cell({ c: iCol, r: iRow })], labelOfColumn, name)
            }
            if (!value) continue
            // 値チェック
            if (control === 'click' && value !== '○') {
                throw new AppError((iRow + 1) + '行目「' + name + '」の' + label.data + 'の値が不正です。(clickの場合、○またはスペースのみ許容)')
            }
            else if (control === 'check' && value !== '○' && value !== '×') {
                throw new AppError((iRow + 1) + '行目「' + name + '」の' + label.data + 'の値が不正です。(checkの場合、○、×またはスペースのみ許容)')
            }
            // CSSセレクタ
            const cssSelector = getCssSelector(sheet[utils.encode_cell({ c: colIndex.cssSelector, r: iRow })], label, name)
            if (!cssSelector && control !== 'dialog') {
                throw new AppError((iRow + 1) + '行目「' + name + '」の' + label.cssSelector + 'が指定されていないか、値が不正です。')
            }
            if (control === 'window' && cssSelector && (!cssSelector.includes('>') || !(cssSelector.split('>')[1]).match(/^[0-9]+$/g))) {
                throw new AppError((iRow + 1) + '行目「' + name + '」の' + label.cssSelector + 'の値が不正です。(windowの場合「>n」形式で記述)')
            }
            // 入力後待機
            let waitAfter = getWaitAfter(sheet[utils.encode_cell({ c: colIndex.waitAfter, r: iRow })], label, name)
            if (!waitAfter) {
                waitAfter = config.webDriver.intervalMSec.afterOperation
            }
            // 配列に追加
            transaction.push({
                label: labelOfColumn, name, control, cssSelector, waitAfter, style, value
            })
        }
        // 配列に追加
        data.push(transaction)
    }
    return data
})

const getLabel = ((cell: CellObject, iCol: number): string | undefined => {
    if (!cell || !cell.v) return undefined
    if (typeof cell.v === 'string') return cell.v
    if (typeof cell.v === 'number') return String(cell.v)
    Logger.debug((iCol + 1) + '列目のラベル形式不正: getLabel', cell)
    throw new AppError((iCol + 1) + '列目のラベル(1行目)の値が不正です(文字列ではない)')
})
const getName = ((cell: CellObject, label: Config["data"]["label"], iRow: number): string | undefined => {
    if (!cell || !cell.v) return undefined
    if (typeof cell.v === 'string') return cell.v
    if (typeof cell.v === 'number') return String(cell.v)
    Logger.debug('「' + label.name + '」形式不正: getName', cell)
    throw new AppError((iRow + 1) + '行目の「' + label.name + '」の値が不正です(文字列ではない)')
})
const getControl = ((cell: CellObject, label: Config["data"]["label"], name: string): ItemControl | undefined => {
    if (!cell || !cell.v) return undefined
    if (cell.v === 'input') return 'input'
    if (cell.v === 'click') return 'click'
    if (cell.v === 'check') return 'check'
    if (cell.v === 'dialog') return 'dialog'
    if (cell.v === 'window') return 'window'
    Logger.debug('「' + label.control + '」区分不正: getControl', cell)
    throw new AppError('「' + name + '」の「' + label.control + '」の値が不正です(input,click,check,dialog,window以外が指定されている)')
})
const getStyle = ((cell: CellObject, label: Config["data"]["label"], name: string): ItemStyle | undefined => {
    if (!cell || !cell.v) return undefined
    if (cell.v === 'string') return 'string'
    if (cell.v === 'number') return 'number'
    if (cell.v === 'YYYY/MM/DD') return 'YYYY/MM/DD'
    if (cell.v === 'YYYYMMDD') return 'YYYYMMDD'
    if (cell.v === 'file') return 'file'
    if (cell.v === '-') return undefined
    Logger.debug('「' + label.style + '」区分不正: getStyle', cell)
    throw new AppError('「' + name + '」の「' + label.style + '」の値が不正です(string,number,YYYY/MM/DD/,YYYYMMDD,file以外が指定されている')
})
const getCssSelector = ((cell: CellObject, label: Config["data"]["label"], name: string): string | undefined => {
    if (!cell || !cell.v) return undefined
    if (typeof cell.v === 'string') return cell.v
    Logger.debug('「' + label.cssSelector + '」形式不正: getCssSelector', cell)
    throw new AppError('「' + name + '」の「' + label.cssSelector + '」の値が不正です(文字列ではない)')
})
const getWaitAfter = ((cell: CellObject, label: Config["data"]["label"], name: string): number | undefined => {
    if (!cell || !cell.v) return undefined
    if (typeof cell.v === 'number') return cell.v
    Logger.debug('「' + label.waitAfter + '」形式不正: getWaitAfter', cell)
    throw new AppError('「' + name + '」の「' + label.waitAfter + '」の値が不正です(数値ではない)')
})
const getValueStringFromString = ((cell: CellObject, labelOfColumn: string, name: string): string | undefined => {
    if (!cell || !cell.v) return undefined
    if (typeof cell.v === 'string') return cell.v
    if (typeof cell.v === 'number') return String(cell.v)
    Logger.debug('「' + labelOfColumn + '」列「' + name + '」形式不正: getValueStringFromString', cell)
    throw new AppError('「' + labelOfColumn + '」列の「' + name + '」の値が不正です(値が文字列ではない)')
})
const getValueStringFromNumber = ((cell: CellObject, labelOfColumn: string, name: string): string | undefined => {
    if (!cell || !cell.v) return undefined
    if (typeof cell.v === 'number') return String(cell.v)
    if (typeof cell.v === 'string' && cell.v === '""') return cell.v
    Logger.debug('「' + labelOfColumn + '」列「' + name + '」形式不正: getValueStringFromNumber', cell)
    throw new AppError('「' + labelOfColumn + '」列の「' + name + '」の値が不正です(値が数値ではない)')
})
const getValueStringFromDate = ((cell: CellObject, labelOfColumn: string, name: string): string | undefined => {
    if (!cell || !cell.v) return undefined
    if ((cell.v instanceof Date)) return getDateAsString(cell.v)
    if (typeof cell.v === 'string' && cell.v === '""') return cell.v
    Logger.debug('「' + labelOfColumn + '」列「' + name + '」形式不正: getValueStringFromDate', cell)
    throw new AppError('「' + labelOfColumn + '」列の「' + name + '」の値が不正です(値が日付ではない)')
})
const getValueStringFromDateNoSlash = ((cell: CellObject, labelOfColumn: string, name: string): string | undefined => {
    if (!cell || !cell.v) return undefined
    if ((cell.v instanceof Date)) return getDateAsStringNoSlash(cell.v)
    if (typeof cell.v === 'string' && cell.v === '""') return cell.v
    Logger.debug('「' + labelOfColumn + '」列「' + name + '」形式不正: getValueStringFromDateNoSlash', cell)
    throw new AppError('「' + labelOfColumn + '」列の「' + name + '」の値が不正です(値が日付ではない)')
})

interface ColumnIndex {
    name?: number,
    control?: number,
    cssSelector?: number,
    waitAfter?: number,
    style?: number,
    dataStart?: number,
    dataMax?: number,
}