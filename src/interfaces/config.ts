const browsers = ['chrome', 'edge', 'ie'] as const
type Browsers = typeof browsers[number]

/** 動作設定 */
interface Config {
    webDriver: {
        browser: Browsers,
        chromeOptions: string[],
        edgeOptions: string[],
        ieOptions: {
            [key: string]: unknown
        }
        timeoutMSec: number,
        intervalMSec: {
            afterLogin: number,
            afterTransaction: number,
            afterOperation: number,
            afterQuit: number,
        },
    },
    siteInfo: {
        urlFilePath: string,
        loginFilePath: string,
    }
    data: {
        filePath: string,
        sheetName: string,
        label: {
            name: string,
            control: string,
            cssSelector: string,
            xPath: string,
            waitAfter: number,
            style: string,
            data: string,
        },
    }
}