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
        const label = sheet[utils.encode_cell({ c: iCol, r: 0 })]
        if (!label || !label.v) continue
        if (label.v.startsWith(label.data)) continue

        const transaction: Operation[] = []
        // 項目ごとに1行ずつ処理する
        for (let iRow = 1; ; iRow++) {
            // 項目名 (指定が無い場合は当該列処理終了)
            const name = getValueString(sheet[utils.encode_cell({ c: colIndex.name, r: iRow })])
            if (!name) break
            // 操作 (指定が無い場合は項目単位にスキップ)
            const control = getValueControl(sheet[utils.encode_cell({ c: colIndex.control, r: iRow })])
            if (!control) continue
            // 形式
            const style = getValueStyle(sheet[utils.encode_cell({ c: colIndex.style, r: iRow })])
            if (control === 'input' && !style) {
                throw new AppError((iRow + 1) + '行目「' + name + '」の' + label.style + 'が指定されていないか、値が不正です。')
            }
            // 値 (指定が無い場合は項目単位にスキップ)
            let value: string | undefined
            if (style === 'number') {
                value = getValueStringFromNumber(sheet[utils.encode_cell({ c: iCol, r: iRow })])
            }
            else if (style === 'YYYY/MM/DD') {
                value = getValueStringFromDate(sheet[utils.encode_cell({ c: iCol, r: iRow })])
            }
            else if (style === 'YYYYMMDD') {
                value = getValueStringFromDateNoSlash(sheet[utils.encode_cell({ c: iCol, r: iRow })])
            }
            else {
                value = getValueString(sheet[utils.encode_cell({ c: iCol, r: iRow })])
            }
            if (!value) continue
            // CSSセレクタ
            const cssSelector = getValueString(sheet[utils.encode_cell({ c: colIndex.cssSelector, r: iRow })])
            if (!cssSelector && control !== 'dialog') {
                throw new AppError((iRow + 1) + '行目「' + name + '」の' + label.cssSelector + 'が指定されていないか、値が不正です。')
            }
            // 入力後待機
            let waitAfter = getValueNumber(sheet[utils.encode_cell({ c: colIndex.waitAfter, r: iRow })])
            if (!waitAfter) {
                waitAfter = config.webDriver.intervalMSec.afterOperation
            }
            // 配列に追加
            transaction.push({
                label, name, control, cssSelector, waitAfter, style, value
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
    if (cell.v === 'dialog') return 'dialog'
    Logger.debug('操作指定区分不正')
    Logger.debug(cell)
    return undefined
})
const getValueStyle = ((cell: CellObject): ItemStyle | undefined => {
    if (!cell) return undefined
    if (cell.v === 'string') return 'string'
    if (cell.v === 'number') return 'number'
    if (cell.v === 'YYYY/MM/DD') return 'YYYY/MM/DD'
    if (cell.v === 'YYYYMMDD') return 'YYYYMMDD'
    if (cell.v === '-') return undefined
    Logger.debug('形式指定区分不正')
    Logger.debug(cell)
    return undefined
})
const getValueString = ((cell: CellObject): string | undefined => {
    if (!cell) return undefined
    if (!cell.v) return undefined
    if (typeof cell.v === 'string') return cell.v
    if (typeof cell.v === 'number') return String(cell.v)
    Logger.debug('形式不正: getValueString')
    Logger.debug(cell)
    return undefined
})
const getValueNumber = ((cell: CellObject): number | undefined => {
    if (!cell) return undefined
    if (!cell.v) return undefined
    if (typeof cell.v === 'number') return cell.v
    Logger.debug('形式不正: getValueNumber')
    Logger.debug(cell)
    return undefined
})
const getValueStringFromNumber = ((cell: CellObject): string | undefined => {
    if (!cell) return undefined
    if (!cell.v) return undefined
    if (typeof cell.v === 'number') return String(cell.v)
    Logger.debug('形式不正: getValueStringFromNumber')
    Logger.debug(cell)
    return undefined
})
const getValueStringFromDate = ((cell: CellObject): string | undefined => {
    if (!cell) return undefined
    if (!cell.v) return undefined
    if ((cell.v instanceof Date)) return getDateAsString(cell.v)
    Logger.debug('形式不正: getValueStringFromDate')
    Logger.debug(cell)
    return undefined
})

const getValueStringFromDateNoSlash = ((cell: CellObject): string | undefined => {
    if (!cell) return undefined
    if (!cell.v) return undefined
    if ((cell.v instanceof Date)) return getDateAsStringNoSlash(cell.v)
    Logger.debug('形式不正: getValueStringFromDateNoSlash')
    Logger.debug(cell)
    return undefined
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