import { WebDriver, Builder, By, Capabilities, until, Key } from 'selenium-webdriver'
import { AppError, sleep } from './util.module'

/** Microsoft Edge の WebDriver を取得 */
export const getEdgeWebDriver = (async (edgeOptions: string[]): Promise<WebDriver> => {
    const capabilities = Capabilities.edge()
        .set('ms:edgeOptions', {
            args: edgeOptions
        })
    // ブラウザを起動
    return await new Builder()
        .withCapabilities(capabilities)
        .build()
        .catch((e) => {
            throw new AppError('ブラウザの起動に失敗しました。', e)
        })
})

/** ログイン処理 (初回のみ処理) */
export const login = (async (driver: WebDriver, loginUrl: string, loginTransaction: Operation[], timeout: number)
    : Promise<void> => {
    // ログインURLを開く
    await driver.get(loginUrl)
        .catch((e) => {
            throw new AppError('ログインページへのアクセスに失敗しました。', e)
        })
    // ログイン処理データにしたがってオペレーションする
    for (const operation of loginTransaction) {
        await doOperation(driver, operation, timeout)
        await sleep(operation.waitAfter)
    }
})

/** 取引処理 */
export const runTransaction = (async (driver: WebDriver, startUrl: string, transaction: Operation[], timeout: number)
    : Promise<void> => {
    // スタートURLを開く
    await driver.get(startUrl)
        .catch((e) => {
            throw new AppError('スタートページへのアクセスに失敗しました。', e)
        })
    // 取引処理データにしたがってオペレーション
    for (const operation of transaction) {
        await doOperation(driver, operation, timeout)
        await sleep(operation.waitAfter)
    }
})

const doOperation = (async (driver: WebDriver, operation: Operation, timeout: number) => {
    // クリック操作の場合
    if (operation.control === 'click' && operation.cssSelector) {
        await driver
            .wait(until.elementLocated(By.css(operation.cssSelector)), timeout)
            .click()
            .catch((e) => {
                throw new AppError('「' + operation.label + '」列の項目「' + operation.name + '」のクリックに失敗しました。', e)
            })
    }
    // 入力操作の場合
    else if (operation.control === 'input' && operation.cssSelector) {
        // 入力値のクリア
        const element = await driver
            .wait(until.elementLocated(By.css(operation.cssSelector)), timeout)
            .catch((e) => {
                throw new AppError('「' + operation.label + '」列の項目「' + operation.name + '」の入力に失敗しました。', e)
            })
        await element.clear()
            .catch((e) => {
                throw new AppError('「' + operation.label + '」列の項目「' + operation.name + '」の入力値のクリアに失敗しました。', e)
            })
        // 「""」の場合は入力値のクリアのみ
        if (operation.value === '""') return
        // 入力
        await element.sendKeys(operation.value)
            .catch((e) => {
                throw new AppError('「' + operation.label + '」列の項目「' + operation.name + '」の値の入力に失敗しました。', e)
            })
        // 入力値確定(TAB入力)
        await element.sendKeys(Key.TAB)
            .catch((e) => {
                throw new AppError('「' + operation.label + '」列の項目「' + operation.name + '」の値の入力値確定に失敗しました。', e)
            })
    }
    // チェック操作の場合
    if (operation.control === 'check' && operation.cssSelector) {
        const element = await driver
            .wait(until.elementLocated(By.css(operation.cssSelector)), timeout)
            .catch((e) => {
                throw new AppError('「' + operation.label + '」列の項目「' + operation.name + '」のチェックに失敗しました。', e)
            })
        const isSelected = await element.isSelected()
        if ((!isSelected && operation.value === '○') || (isSelected && operation.value === '×')) {
            await element.click()
                .catch((e) => {
                    throw new AppError('「' + operation.label + '」列の項目「' + operation.name + '」のチェックに失敗しました。', e)
                })
        }
    }
    // ダイアログ操作の場合
    else if (operation.control === 'dialog') {
        await driver
            .wait(until.alertIsPresent(), timeout)
            .catch((e) => {
                throw new AppError('「' + operation.label + '」列の項目「' + operation.name + '」のダイアログ取得に失敗しました。', e)
            })
        await sleep(operation.waitAfter)
        const alert = await driver.switchTo().alert()
        // OK
        if (operation.value === 'OK') {
            await alert.accept()
                .catch((e) => {
                    throw new AppError('「' + operation.label + '」列の項目「' + operation.name + '」のダイアログOKのクリックに失敗しました。', e)
                })
        }
        // Cancel
        else if (operation.value === 'Cancel') {
            await alert.dismiss()
                .catch((e) => {
                    throw new AppError('「' + operation.label + '」列の項目「' + operation.name + '」のダイアログCancelのクリックに失敗しました。', e)
                })
        }
        // 値入力+OK
        else {
            await alert.sendKeys(operation.value)
                .catch((e) => {
                    throw new AppError('「' + operation.label + '」列の項目「' + operation.name + '」のダイアログの値の入力に失敗しました。', e)
                })
            await alert.accept()
                .catch((e) => {
                    throw new AppError('「' + operation.label + '」列の項目「' + operation.name + '」のダイアログOKのクリックに失敗しました。', e)
                })
        }
    }
})