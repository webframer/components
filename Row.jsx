import cn from 'classnames'
import React from 'react'
import { accessibilitySupport } from './react.js'

/**
 * Row Layout - Pure Component.
 * With default `display: flex` row style
 * (to be used as replacement for `<div></div>` for cross platform integration)
 *
 * @param {string} [className] - optional css class
 * @param {Function} [onClick] - callback to fire on click or Enter press (if `onKeyPress` not given)
 * @param {Boolean} [fill] - whether to make the view fill up available height and width
 * @param {Boolean} [reverse] - whether to reverse order of rendering
 * @param {Boolean} [rtl] - whether to use right to left direction
 * @param {Object} [sound] - new Audio(URL) sound file
 * @param {*} props - other attributes to pass to `<div></div>`
 * @param {*} [ref] - callback(element) when component mounts, or from React.createRef()
 * @returns {Object} - React Component
 */
export function Row ({
  className, fill, reverse, rtl, left, right, top, bottom, center, middle, sound, ...props
}, ref) {
  props = accessibilitySupport(props, sound)
  if (typeof ref === 'function') props.ref = ref
  return <div
    className={cn(
      className, 'row',
      {fill, reverse, rtl, left, right, top, bottom, center, middle, pointer: props.onClick},
    )}
    {...props}
  />
}

export const RowRef = React.forwardRef(Row)
export default React.memo(Row)
