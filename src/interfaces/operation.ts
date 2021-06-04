const itemControls = ['input', 'click', 'check', 'dialog'] as const
type ItemControl = typeof itemControls[number]

const itemStyles = ['string', 'number', 'YYYY/MM/DD', 'YYYYMMDD'] as const
type ItemStyle = typeof itemStyles[number]

/** 操作 */
interface Operation {
    label: string,
    name: string,
    control: ItemControl,
    cssSelector?: string,
    waitAfter: number,
    style?: ItemStyle,
    value: string
}