import cn from 'classnames'
import * as React from 'react'
import { accessibilitySupport } from '../react.js'
import { type } from '../types.js'
import { useTooltip } from './Tooltip.js'

// Wrap with HOC so that IDE automatically imports default, instead of pure function
function createText () {
  /**
   * Text View - Pure Component
   * (to be used as replacement for `<span></span>` for cross platform integration).
   * @see https://webframe.app/docs/ui/components/Text
   */
  function Text ({
    small, smaller, smallest, large, larger, largest,
    className, fill, reverse, rtl, sound, children, _ref,
    ...props
  }) {
    const [tooltip] = useTooltip(props)
    props = accessibilitySupport(props, sound)
    if (_ref) props.ref = _ref
    return (
      <span className={cn(className, 'text', {
        small, smaller, smallest, large, larger, largest,
        fill, reverse, rtl, pointer: props.onClick && props.tabIndex !== -1,
      })} {...props}>{children}{tooltip}</span>
    )
  }

  Text.propTypes = {
    // The text content
    children: type.NodeOrFunction,
    className: type.ClassName,
    style: type.Style,
    tooltip: type.Tooltip,
    _ref: type.Ref,
  }
  return [Text]
}

export const [Text] = createText()
const TextMemo = React.memo(Text)
TextMemo.name = Text.name
TextMemo.propTypes = Text.propTypes
export default TextMemo
