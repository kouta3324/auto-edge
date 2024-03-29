const itemControls = ['input', 'click', 'check', 'dialog', 'window'] as const
type ItemControl = typeof itemControls[number]

const itemStyles = ['string', 'number', 'YYYY/MM/DD', 'YYYYMMDD', 'file'] as const
type ItemStyle = typeof itemStyles[number]

/** 操作 */
interface Operation {
    label: string,
    name: string,
    control: ItemControl,
    cssSelector?: string,
    xPath?: string,
    waitAfter: number,
    style?: ItemStyle,
    value: string
}