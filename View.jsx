import cn from 'classnames'
import React, { useEffect, useRef } from 'react'
import { accessibilitySupport, isRef } from './react.js'
import { useTooltip } from './Tooltip.jsx'
import { type } from './types.js'
import { applyStyles } from './utils/css.js'

// @todo: test rendering without React.memo on large scene to see which is faster.
/**
 * Create a React View - Pure Component
 * @param {string} [defaultProp] - the prop to make true by default
 * @return {function[]} React function component and forwardRef component
 */
export function createView (defaultProp) {
  /**
   * View Layout - Pure Component.
   * With default `display: flex` in column/row style
   * (to replace browser's `<div>` with a platform-agnostic component for React Native, etc.)
   *
   * @param {boolean} [scroll] - whether to make the view scrollable
   * @param {boolean} [col] - whether to use column layout, true if `row` is falsy by default
   * @param {boolean} [row] - whether to use row layout, false by default
   * @param {string} [className] - optional css class
   * @param {function} [onClick] - callback to fire on click or Enter press (if `onKeyPress` not given)
   * @param {boolean} [fill] - whether to make the view fill up available height and width
   * @param {boolean} [reverse] - whether to reverse the order of rendering
   * @param {boolean} [rtl] - whether to use right to left text direction
   * @param {object|HTMLAudioElement} [sound] - new Audio(URL) sound file
   * @param {*} props - other attributes to pass to `<div></div>`
   * @param {function|React.MutableRefObject} [ref] - forwarding React.useRef() or React.createRef()
   */
  function View ({
    className, scroll, row, col = !row, fill, reverse, rtl,
    left, right, top, bottom, center, middle, sound,
    children, ...props
  }, ref) {
    const [tooltip] = useTooltip(props)
    props = accessibilitySupport(props, sound)
    if (isRef(ref)) props.ref = ref

    // Ordinary View
    if (!scroll) {
      className = cn(
        className, {
          col, row, fill, reverse, rtl,
          left, right, top, bottom, center, middle,
          pointer: props.onClick,
        },
      )
      return <div className={className} {...props}>{children}{tooltip}</div>
    }

    // Scrollable View
    let propsWrap
    let {classScroll, styleScroll, style, ..._props} = props
    if (_props._id !== void 0) {
      propsWrap = {_id: _props._id, _nodrop: ''}
      _props._nodrag = ''
    }

    // // @archive: position absolute version
    // // CSS styles required:
    // // .col > .scrollable,
    // // .row > .scrollable {
    // //   flex: 1;
    // // }
    // // ```
    // className = cn(className, 'scrollable', {col, row, fill, rtl})
    // classScroll = cn({'position-fill': scroll})

    // @Flexbox version
    className = cn( // outer div container
      className, 'scroll', {
        col, row, fill, rtl,
        center: center && !row,
        middle: middle && !col,
      },
      // 'max-size' class is to be extended inside _layout.less to reduce html footprint
      // 'max-size', // row ? 'max-width' : 'max-height', // a scroll can overflow in any direction
    )
    classScroll = cn( // inner div directly wrapping the children
      classScroll, row ? 'min-width' : 'min-height', {
        col, row, fill, reverse, rtl,
        left, right, top, bottom, center, middle,
        pointer: props.onClick,
        'margin-auto-h': center, // when layout is row and inner div is smaller than outer
        'margin-auto-v': middle, // when layout is col and inner div is smaller than outer
      },
    )

    // @experimental: max-height/width calculation for direct parent element
    const refWrap = useRef(null)
    useEffect(() => {
      if (!refWrap.current.parentElement) return
      let attr = maxSizeScrollOffset(refWrap.current.parentElement)
      if (attr) {
        return () => {
          let {current: node} = refWrap
          if (!node) return

          // Only reset parent style if no other scrollables exist
          if (node.parentElement && node.parentElement[attr]) {
            if (!hasScrollElement(node.parentElement, node)) {
              applyStyles(node.parentElement.style, node.parentElement[attr])
              delete node.parentElement[attr]
            }
          }
          node = null
        }
      }
    })

    // Scroll View
    return (
      <div className={className} style={style} ref={refWrap} {...propsWrap} >
        <div className={classScroll} style={styleScroll} {..._props}>{children}</div>
        {tooltip}
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
    classScroll: type.String,
    styleScroll: type.Object,
  }

  return [View, ViewRef]
}

export const [View, ViewRef] = createView()

/**
 * Components, like View will be faster without memoization, whereas Text should be memoized.
 * This is because whenever parent component re-renders, a View component wrapping other components
 * will have its `children` prop changed. Thus, it will generally be slower when memoized.
 */
export default React.memo(View)

/**
 * Check whether given Node element contains a Scroll component by its className
 * @param {object|HTMLElement} parentElement - element to check
 * @param {object|HTMLElement} [scrollElement] - the node to exclude from check
 * @param {string} [className] - to identify the Scroll component
 * @returns {boolean} true - if node contains at least once Scroll component
 */
export function hasScrollElement (parentElement, scrollElement = null, className = 'scroll') {
  for (const child of parentElement.children) {
    if (child === scrollElement) continue
    if (child.className.split(/\s+/).indexOf(className) >= 0) return true
  }
  return false
}

/**
 * Set CSS max-height/width offset style for direct Parent element of a flex Scroll component
 * to prevent clipping of content when Scroll overflows the Parent.
 * @param {object|HTMLElement} parentElement - direct parent node to offset scroll
 * @param {string} [className] - to identify the Scroll component
 * @param {string} [attr] - attribute key to store the original parentElement.style for reset later
 * @returns {string|void} attribute - modified style attribute that was attached to parentElement
 */
export function maxSizeScrollOffset (parentElement, className = 'scroll', attr = '@scrollReset') {
  if (parentElement === document.body) return

  // Scroll offset style only works when set to the parent or higher up nested grandparents.
  // The offset must be in the direction of the scroll, not the parent.
  // Offset amount must be accumulated from parent siblings, grandparent siblings, and so on...
  // Offset should not take in account `absolute` and `fixed` sibling elements.
  let directions = ['column', 'row']
  let offsetBy = {
    [directions[0]]: 0,
    [directions[1]]: 0,
  }
  let attrBy = {
    [directions[0]]: 'offsetHeight',
    [directions[1]]: 'offsetWidth',
  }
  let offset = 0
  let direction
  let grandParent
  let parent = parentElement
  while (parent.parentElement) {
    grandParent = parent.parentElement
    // Skip offset calculation if the ancestor does not affect layout flow of its siblings, like Modal
    if (!scrollOffsetExclude[getComputedStyle(parent).getPropertyValue('position')]) {
      direction = getComputedStyle(grandParent).getPropertyValue('flex-direction').replace('-reverse', '')
      if (directions.indexOf(direction) >= 0) {
        for (const sibling of grandParent.children) {
          if (sibling === parent) continue // skip the direct ancestor
          if (sibling.className.split(/\s+/).indexOf(className) >= 0) continue // skip scrollables
          if (scrollOffsetExclude[getComputedStyle(sibling).getPropertyValue('position')]) continue
          offset += (offsetBy[direction] += sibling[attrBy[direction]])
        }
      }
    }
    if (grandParent === document.body) break
    parent = grandParent
  }
  parent = null
  if (!offset) return

  let style = {}
  for (const direction in offsetBy) {
    offset = offsetBy[direction]
    style[attrBy[direction].replace('offset', 'max')] = offset ? `calc(100% - ${offset}px)` : null
  }

  // Set new parent max size every time to maximize the chances of correct layout
  style = applyStyles(parentElement.style, style)

  // Only save original parent style once, because there could be multiple scrollables
  if (!parentElement[attr]) parentElement[attr] = style
  return attr
}

const scrollOffsetExclude = {
  'absolute': true,
  'fixed': true,
}
