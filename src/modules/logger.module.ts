import * as Log4js from 'log4js'
import { readFileSync } from 'fs'
import { parse } from 'jsonc-parser'

/** ロガー */
export class Logger {

    /** 初期化 */
    public static init(): void {
        const configure: Log4js.Configuration = parse(readFileSync('./log4js.jsonc').toString())
        Log4js.configure(configure)
    }

    /** デバッグログ出力 */
    public static async debug(message: unknown): Promise<void> {
        const logger = Log4js.getLogger('debug')
        logger.debug((typeof message === 'string') ? message : JSON.stringify(message))
    }

    /** インフォログ出力 */
    public static async info(message: unknown): Promise<void> {
        const logger = Log4js.getLogger('info')
        logger.info((typeof message === 'string') ? message : JSON.stringify(message))
    }

    /** エラーログ出力 */
    public static async error(message: unknown, error?: Error): Promise<void> {
        const logger = Log4js.getLogger('error')
        logger.error((typeof message === 'string') ? message : JSON.stringify(message))
        logger.error(JSON.stringify(error))
    }

}