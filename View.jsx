import cn from 'classnames'
import React from 'react'
import { accessibilitySupport } from './react.js'
import { type } from './types.js'

// @todo: test rendering without React.memo on large scene to see which is faster.
/**
 * Create a React View - Pure Component
 * @param {string} [defaultProp] - the prop to make true by default
 * @return {function[]} React function component and forwardRef component
 */
export function createView (defaultProp) {
  function View ({
    className, scroll, row, col = !row, fill, reverse, rtl,
    left, right, top, bottom, center, middle, sound,
    ...props
  }, ref) {
    props = accessibilitySupport(props, sound)

    // Ordinary View
    if (!scroll) {
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

    // Scrollable View
    const {style, classInner, styleInner, ..._props} = props
    className = cn(
      className, 'scroll',
      row ? 'row max-width' : 'col max-height',
      {
        fill, rtl,
        center: center && !row,
        middle: middle && !col,
        pointer: props.onClick,
      },
    )
    return (
      <div className={className} style={style} {...typeof ref === 'function' && {ref}}>
        <div className={cn(
          classInner, row ? 'row min-width' : 'col min-height',
          {
            fill, reverse, rtl,
            left, right, top, bottom,
            'margin-auto-h': center, // when layout is row and inner div is smaller than outer
            'margin-auto-v': middle, // when layout is col and inner div is smaller than outer
            pointer: props.onClick,
          },
        )} style={styleInner} {..._props} />
      </div>
    )
  }

  const ViewRef = React.forwardRef(View)

  if (defaultProp) View.defaultProps = {[defaultProp]: true}

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
    children: type.Any,
    className: type.String,
    // Scroll View only
    scroll: type.Boolean,
    classInner: type.String,
    styleInner: type.Object,
  }

  return [View, ViewRef]
}

/**
 * View Layout - Pure Component.
 * With default `display: flex` in column/row style
 * (to replace browser's `<div>` with a platform-agnostic component for React Native, etc.)
 *
 * @param {boolean} [scroll] - whether to make the view scrollable
 * @param {boolean} [col] - whether to use column layout, true if `row` is falsy
 * @param {boolean} [row] - whether to use row layout, false by default
 * @param {string} [className] - optional css class
 * @param {function} [onClick] - callback to fire on click or Enter press (if `onKeyPress` not given)
 * @param {boolean} [fill] - whether to make the view fill up available height and width
 * @param {boolean} [reverse] - whether to reverse order of rendering
 * @param {boolean} [rtl] - whether to use right to left text direction
 * @param {object|HTMLAudioElement} [sound] - new Audio(URL) sound file
 * @param {*} props - other attributes to pass to `<div></div>`
 * @param {function} [ref] - callback(element) when component mounts, or from React.createRef()
 */
export const [View, ViewRef] = createView()
export default React.memo(View)
