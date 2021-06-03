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
    public static async debug(message: unknown, detail?: unknown): Promise<void> {
        const logger = Log4js.getLogger('debug')
        logger.debug((typeof message === 'string') ? message : JSON.stringify(message))
        logger.debug(detail)
    }

    /** インフォログ出力 */
    public static async info(message: unknown): Promise<void> {
        const logger = Log4js.getLogger('info')
        logger.info((typeof message === 'string') ? message : JSON.stringify(message))
    }

    /** 警告ログ出力 */
    public static async warn(message: unknown): Promise<void> {
        const logger = Log4js.getLogger('warn')
        logger.warn((typeof message === 'string') ? message : JSON.stringify(message))
    }

    /** エラーログ出力 */
    public static async error(error: unknown): Promise<void> {
        const debugLogger = Log4js.getLogger('debug')
        debugLogger.error(error)
        const logger = Log4js.getLogger('error')
        logger.error((error instanceof Error) ? error.message : error)
    }

}