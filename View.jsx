import cn from 'classnames'
import React from 'react'
import { accessibilitySupport } from './react.js'
import { type } from './types.js'

// @todo: test rendering without React.memo on large scene to see which is faster.
export function createView (layout = null) {
  function View ({
    className, row, col = !row, fill, reverse, rtl, left, right, top, bottom, center, middle, sound,
    ...props
  }, ref) {
    props = accessibilitySupport(props, sound)
    props.className = cn(
      className,
      {
        col, row, fill, reverse, rtl,
        left, right, top, bottom, center, middle,
        pointer: props.onClick,
      },
    )
    if (typeof ref === 'function') props.ref = ref
    return <div {...props} />
  }

  if (layout) View.defaultProps = {[layout]: true}

  View.propTypes = {
    col: type.Boolean,
    row: type.Boolean,
    fill: type.Boolean,
    reverse: type.Boolean,
    rtl: type.Boolean,
    left: type.Boolean,
    right: type.Boolean,
    top: type.Boolean,
    bottom: type.Boolean,
    center: type.Boolean,
    middle: type.Boolean,
    sound: type.Object,
    className: type.String,
    children: type.Any,
  }

  return View
}

/**
 * View Layout - Pure Component.
 * With default `display: flex` in column/row style
 * (to be used as replacement for `<div></div>` for cross platform integration)
 *
 * @param {Boolean} [col] - whether to use column layout, true if `row` is falsy
 * @param {Boolean} [row] - whether to use row layout, false by default
 * @param {string} [className] - optional css class
 * @param {function} [onClick] - callback to fire on click or Enter press (if `onKeyPress` not given)
 * @param {Boolean} [fill] - whether to make the view fill up available height and width
 * @param {Boolean} [reverse] - whether to reverse order of rendering
 * @param {Boolean} [rtl] - whether to use right to left text direction
 * @param {Object|HTMLAudioElement} [sound] - new Audio(URL) sound file
 * @param {*} props - other attributes to pass to `<div></div>`
 * @param {*} [ref] - callback(element) when component mounts, or from React.createRef()
 */
export const View = createView()
export const ViewRef = React.forwardRef(View)
export default React.memo(View)
