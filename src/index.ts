import { parse } from 'jsonc-parser'
import { readFileSync } from 'fs'
import { WebDriver } from 'selenium-webdriver'

import { Logger } from './modules/logger.module'
import { notifyComplete, sleep } from './modules/util.module'
import { getTransactionData, getDataSheet } from './modules/excel-to-json.module'
import { getEdgeWebDriver, login, runTransaction } from './modules/web-driver.module'

(async () => {

    // ロガー初期化
    Logger.init()

    // 定義ロード
    const config: Config = parse(readFileSync('./config.jsonc').toString())
    const urlInfo: UrlInfo = parse(readFileSync(config.siteInfo.urlFilePath).toString())
    const loginTransaction: Operation[] = parse(readFileSync(config.siteInfo.loginFilePath).toString())

    // データシートロード
    const sheet = getDataSheet(config.data.filePath, config.data.sheetName)
    const data = getTransactionData(config.data.label, sheet)

    // ブラウザ起動
    const driver: WebDriver = await getEdgeWebDriver(config.webDriver.edgeOptions)

    try {
        // ログイン処理
        Logger.info(loginTransaction)
        await login(driver, urlInfo.loginUrl, loginTransaction, config.webDriver.waitMSecAfterTransaction)
        await sleep(config.webDriver.waitMSecAfterTransaction)

        // 取引処理
        Logger.info(data)
        for (const transaction of data) {
            await runTransaction(driver, urlInfo.startUrl, transaction, config.webDriver.waitMSecAfterTransaction)
            await sleep(config.webDriver.waitMSecAfterTransaction)
        }
    } finally {
        // ブラウザ終了
        driver && await driver.quit()
    }

    // 完了通知
    notifyComplete(data.length + '件 処理完了しました。')

})()