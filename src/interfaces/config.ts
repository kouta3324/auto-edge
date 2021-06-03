/** 動作設定 */
interface Config {
    webDriver: {
        edgeOptions: string[],
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
            waitAfter: number,
            style: string,
            data: string,
        },
    }
}