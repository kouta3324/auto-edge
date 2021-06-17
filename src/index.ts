import { parse } from 'jsonc-parser'
import { existsSync, readFileSync } from 'fs'

import { Logger } from './modules/logger.module'
import { notifyComplete, notifyError, sleep } from './modules/util.module'
import { getTransactionData, getDataSheet } from './modules/excel-to-json.module'
import { getWebDriver, login, runTransaction } from './modules/web-driver.module'

const main = (async () => {

    // 基本定義ロード
    if (!existsSync('./config.jsonc')) {
        throw new Error('基本定義' + ' ファイル (' + './config.jsonc' + ') が存在しません。')
    }
    const config: Config = parse(readFileSync('./config.jsonc').toString())

    // ファイルチェック
    checkFiles(config)

    // 各種定義ロード
    const urlInfo: UrlInfo = parse(readFileSync(config.siteInfo.urlFilePath).toString())
    const loginTransaction: Operation[] = parse(readFileSync(config.siteInfo.loginFilePath).toString())

    // データシートロード
    const sheet = getDataSheet(config.data.filePath, config.data.sheetName)
    const data = getTransactionData(config, sheet)

    // ブラウザ起動
    const driver = await getWebDriver(config.webDriver)

    // ログイン処理
    Logger.info(loginTransaction)
    await login(driver, urlInfo.loginUrl, loginTransaction, config.webDriver.timeoutMSec)
    await sleep(config.webDriver.intervalMSec.afterLogin)

    // 取引処理
    Logger.info(data)
    for (const transaction of data) {
        await runTransaction(driver, urlInfo.startUrl, transaction, config.webDriver.timeoutMSec)
        await sleep(config.webDriver.intervalMSec.afterTransaction)
    }

    if (driver) {
        // ブラウザ終了
        driver && await driver.quit()
        await sleep(config.webDriver.intervalMSec.afterQuit)
    }

    // 完了通知
    notifyComplete(data.length + '件 処理完了しました。')

})

const checkFiles = ((config: Config): void => {
    let fileName, filePath: string
    if (!existsSync(config.siteInfo.urlFilePath)) {
        fileName = 'URL情報ファイル'
        filePath = config.siteInfo.urlFilePath
    }
    else if (!existsSync(config.siteInfo.loginFilePath)) {
        fileName = 'ログイン操作情報'
        filePath = config.siteInfo.loginFilePath
    }
    else if (!existsSync(config.data.filePath)) {
        fileName = '実行データ'
        filePath = config.data.filePath
    } else {
        return
    }
    throw new Error(fileName + ' ファイル (' + filePath + ') が存在しません。')
});

// 起動ポイント
(async () => {
    try {
        Logger.init()
        await main()
    } catch (e) {
        if (e instanceof Error) {
            notifyError(e.message)
        } else {
            notifyError('予期しないエラーが発生しました。(' + e + ')')
        }
        Logger.error(e)
    }
})()