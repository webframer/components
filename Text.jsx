import cn from 'classnames'
import React from 'react'
import { accessibilitySupport } from './react.js'
import { useTooltip } from './Tooltip.jsx'
import { type } from './types.js'

// Wrap with HOC so that IDE automatically imports default, instead of pure function
function createText () {
  /**
   * Text View - Pure Component.
   * (to be used as replacement for `<span></span>` for cross platform integration)
   *
   * @param {string} [className] - optional css class name
   * @param {Function} [onClick] - callback to fire on click or Enter press (if `onKeyPress` not given)
   * @param {Boolean} [fill] - whether to make the view fill up available height and width
   * @param {Boolean} [reverse] - whether to reverse order of rendering
   * @param {Boolean} [rtl] - whether to use right to left direction
   * @param {Object} [sound] - new Audio(URL) sound file
   * @param {function|React.MutableRefObject} [_ref] - from React.useRef() or React.createRef()
   * @param {*} props - other attributes to pass to `<div></div>`
   * @returns {object|JSX.Element} - React Component
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
        fill, reverse, rtl, pointer: props.onClick,
      })} {...props}>{children}{tooltip}</span>
    )
  }

  Text.propTypes = {
    children: type.NodeOrFunction,
    className: type.ClassName,
    style: type.Style,
    tooltip: type.Tooltip,
    _ref: type.Ref,
  }
  return [Text]
}

export const [Text] = createText()
export default React.memo(Text)
