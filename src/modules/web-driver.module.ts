import { WebDriver, Builder, By, Capabilities, until } from 'selenium-webdriver'
import { Logger } from './logger.module'
import { notifyError } from './util.module'

/** Microsoft Edge の WebDriver を取得 */
export const getEdgeWebDriver = (async (edgeOptions: string[]): Promise<WebDriver> => {
    const capabilities: Capabilities = Capabilities.edge()
    capabilities.set('ms:edgeOptions', {
        args: edgeOptions
    })
    // ブラウザを起動
    return await new Builder()
        .withCapabilities(capabilities)
        .build()
        .catch((e: Error) => {
            const errMsg = 'ブラウザの起動に失敗しました。'
            Logger.error(e, errMsg)
            Logger.debug(capabilities)
            notifyError(errMsg)
            throw new Error(errMsg)
        })
})

/** ログイン処理 (初回のみ処理) */
export const login = (async (driver: WebDriver, loginUrl: string, loginTransaction: Operation[])
    : Promise<void> => {
    // ログインURLを開く
    await driver.get(loginUrl)
        .catch((e: Error) => {
            const errMsg = 'ログインページへのアクセスに失敗しました。'
            Logger.error(e, errMsg)
            Logger.debug(loginUrl)
            notifyError(errMsg)
            throw new Error(errMsg)
        })
    // ログイン処理データにしたがってオペレーションする
    for (const operation of loginTransaction) {
        await doOperation(driver, operation)
    }
})

/** 取引処理 */
export const runTransaction = (async (driver: WebDriver, startUrl: string, transaction: Operation[])
    : Promise<void> => {
    // スタートURLを開く
    await driver.get(startUrl)
        .catch((e: Error) => {
            const errMsg = 'スタートページへのアクセスに失敗しました。'
            Logger.error(e, errMsg)
            Logger.debug(startUrl)
            notifyError(errMsg)
            throw new Error(errMsg)
        })
    // 取引処理データにしたがってオペレーション
    for (const operation of transaction) {
        await doOperation(driver, operation)
    }
})

const doOperation = (async (driver: WebDriver, operation: Operation) => {
    // クリック操作の場合
    if (operation.control === 'click') {
        await driver
            .wait(until.elementLocated(By.css(operation.cssSelector)), operation.timeoutMSec)
            .click()
            .catch((e: Error) => {
                const errMsg = '項目「' + operation.name + '」のクリックに失敗しました。'
                Logger.error(e, errMsg)
                Logger.debug(operation)
                notifyError(errMsg)
                throw new Error(errMsg)
            })
    }
    // 入力操作の場合
    else if (operation.control === 'input') {
        await driver
            .wait(until.elementLocated(By.css(operation.cssSelector)), operation.timeoutMSec)
            .sendKeys(operation.value)
            .catch((e: Error) => {
                const errMsg = '項目「' + operation.name + '」の入力に失敗しました。'
                Logger.error(e, errMsg)
                Logger.debug(operation)
                notifyError(errMsg)
                throw new Error(errMsg)
            })
    }
})