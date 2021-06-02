const itemControls = ['input', 'click'] as const
type ItemControl = typeof itemControls[number]

const itemStyles = ['string', 'number', 'date'] as const
type ItemStyle = typeof itemStyles[number]

/** 操作 */
interface Operation {
    name: string,
    control: ItemControl,
    cssSelector: string,
    style?: ItemStyle,
    timeoutMSec: number,
    value: string
}