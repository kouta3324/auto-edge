import { notify } from 'node-notifier'
import { join } from 'path'

/** アプリ名 (通知用) */
const APP_NAME = 'AutoEdge'
/** 完了通知アイコン */
const COMPLETE_ICON = '../../img/auto-edge_blue.png'
/** エラー通知アイコン */
const ERROR_ICON = '../../img/auto-edge_yellow.png'

/**
 * 指定された秒数処理を停止する
 * @param mSec 停止時間(ミリ秒)
  */
export const sleep = async (mSec: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, mSec))
}

/**
 * Dateクラスをstringに変換
 * @param date 日付
 * @returns YYYY/MM/DD
 */
export const getDateAsString = ((date: Date): string => {
    const padZero = ((num: number) => {
        return (num < 10 ? '0' : '') + num
    })
    return date.getFullYear() + '/' + padZero(date.getMonth() + 1) + '/' + padZero(date.getDate())
})

/**
 * Dateクラスをstringに変換
 * @param date 日付時刻
 * @returns YYYY/MM/DD HH:mm:ss
 */
export const getTimeAsString = ((date: Date): string => {
    const padZero = ((num: number) => {
        return (num < 10 ? '0' : '') + num
    })
    return date.getFullYear() + '/' + padZero(date.getMonth() + 1) + '/' + padZero(date.getDate()) + ' ' + padZero(date.getHours()) + ':' +
        padZero(date.getMinutes()) + ':' + padZero(date.getSeconds())
})

/**
 * Dateクラスをstringに変換 (ファイル名用)
 * @param date 日付時刻
 * @returns YYYYMMDD_HHmmss
 */
export const getTimeForFilename = ((date: Date): string => {
    const padZero = ((num: number) => {
        return (num < 10 ? '0' : '') + num
    })
    return date.getFullYear() + padZero(date.getMonth() + 1) + padZero(date.getDate()) + '_' + padZero(date.getHours()) +
        padZero(date.getMinutes()) + padZero(date.getSeconds())
})

/**
 * 処理完了通知
 * @param message メッセージ
 * @param title タイトル
 */
export const notifyComplete = (async (message: string, title = '処理完了'): Promise<void> => {
    notify({
        title,
        message,
        icon: join(__dirname, COMPLETE_ICON),
        appID: APP_NAME
    })
})

/**
 * エラー通知
 * @param message メッセージ
 * @param title タイトル
 */
export const notifyError = (async (message: string, title = 'エラー通知'): Promise<void> => {
    notify({
        title,
        message,
        icon: join(__dirname, ERROR_ICON),
        appID: APP_NAME
    })
})