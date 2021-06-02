/** 動作設定 */
interface Config {
    webDriver: {
        edgeOptions: string[],
        waitMSecAfterTransaction: number,
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
            style: string,
            timeout: string,
            data: string,
        },
    }
}