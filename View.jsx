import { hasProp } from '@webframer/js'
import cn from 'classnames'
import React, { useEffect, useRef } from 'react'
import { accessibilitySupport, assignRef, isRef } from './react.js'
import { useTooltip } from './Tooltip.jsx'
import { type } from './types.js'
import { applyStyles } from './utils/css.js'

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
   * @param {function|React.MutableRefObject} [_ref] - from React.useRef() or React.createRef()
   * @param {*} props - other attributes to pass to `<div></div>`
   * @param {function|React.MutableRefObject} [ref] - forwarding React.useRef() or React.createRef()
   */
  function View ({
    className, scroll, row, col = !(row), fill, reverse, rtl,
    left, right, top, bottom, center, middle, sound,
    children, _ref, scrollProps, ...props
  }, ref) {
    const [tooltip] = useTooltip(props)
    props = accessibilitySupport(props, sound)
    if (isRef(ref)) props.ref = ref // forwarded ref may not exist on mount
    else if (_ref) props.ref = _ref // preferred way to ensure ref exists on mount

    // Ordinary View
    if (!(scroll)) {
      className = cn(
        className, {
          col, row, fill, reverse, rtl,
          left, right, top, bottom, center, middle,
          pointer: props.onClick,
        },
      )
      return <div className={className} {...props}>{children}{tooltip}</div>
    }

    // Scrollable View -----------------------------------------------------------------------------
    // The wrapper should get rest props by default, because that's the expected behavior
    let {scrollClass, scrollStyle, style, noOffset, ..._props} = props
    scrollProps = {...scrollProps}
    if (hasProp(_props, '_id')) {
      Object.assign(_props, {_nodrop: ''})
      Object.assign(scrollProps, {_id: _props._id, _nodrag: ''})
    }

    // // @archive: position absolute version
    // // CSS styles required:
    // // .col > .scrollable,
    // // .row > .scrollable {
    // //   flex: 1;
    // // }
    // // ```
    // className = cn(className, 'scrollable', {col, row, fill, rtl})
    // scrollClass = cn({'position-fill': scroll})

    // @Flexbox version
    className = cn( // outer div container
      className, 'scroll', {
        col, row, fill, rtl,
        center: center && !(row), // avoid Tailwind bug by negation with brackets
        middle: middle && !(col),
      },
      // 'max-size' class is to be extended inside _layout.less to reduce html footprint
      // 'max-size', // row ? 'max-width' : 'max-height', // a scroll can overflow in any direction
    )
    scrollClass = cn( // inner div directly wrapping the children
      // @note: this will not prevent overflow in the other direction (ex. Row inside Scroll column)
      // The only way to prevent that is with overflow-x: hidden, but applied to the outer div.
      // If applied to inner div, it makes this inner div restrict itself within the outer div's
      // height (i.e. min-height has no effect anymore).
      // This in turn causes another inner scroll in the same direction to shrink as if this Scroll
      // component was just a View.
      // Questions:
      //    - Should overflow-x be applied to the outer div? or let it overflow,
      //      so users can reach the hidden components and fix it themselves?
      //      Let it overflow - pros and cons:
      //        + Layout issues are visible immediately.
      //        + User can easily reach overflowed element and delete it.
      //        + User does not need to worry about choosing the Scroll direction correctly.
      //        + When left unfixed, overflowed content is accessible.
      //        => this approach is chosen because of benefits above.
      //
      //    - Warn users when there are two nested scroll components with the same direction?
      //      Because that use-case is not valid anyway?
      scrollClass, row ? 'min-width no-max-width' : 'min-height no-max-height', {
        col, row, fill, reverse, rtl,
        left, right, top, bottom, center, middle,
        pointer: props.onClick,
        'margin-auto-h': center, // when layout is row and inner div is smaller than outer
        'margin-auto-v': middle, // when layout is col and inner div is smaller than outer
      },
    )

    // @experimental: max-height/width calculation for direct parent element
    const {current: self} = useRef({})
    if (!self.ref) self.ref = function (node) {
      if (self._ref) assignRef.apply(this, [self._ref, ...arguments])
      self.node = node
    }
    self._ref = props.ref
    _props.ref = self.ref

    useEffect(() => {
      if (noOffset) return
      if (!self.node.parentElement) return
      let attr = maxSizeScrollOffset(self.node.parentElement)
      if (attr) {
        return () => {
          let {node} = self
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
      <div className={className} style={style} {..._props} >
        <div className={scrollClass} style={scrollStyle} {...scrollProps}>{children}</div>
        {tooltip}
      </div>
    )
  }

  const ViewRef = React.forwardRef(View)

  if (defaultProp) View.defaultProps = ViewRef.defaultProps = {[defaultProp]: true}

  View.propTypes = ViewRef.propTypes = {
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
    // Ref for the View or outer Scroll container
    _ref: type.Ref,
    // Whether to use Scroll View
    scroll: type.Boolean,
    // CSS class for inner wrapper Scroll component
    scrollClass: type.String,
    // CSS style for inner wrapper Scroll component
    scrollStyle: type.Object,
    // Props for inner wrapper Scroll component
    scrollProps: type.Object,
    // Whether to prevent Scroll from setting offset style to parent element
    noOffset: type.Boolean,
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
 * @param {Element} parentElement - element to check
 * @param {Element} [scrollElement] - the node to exclude from check
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
 * @param {Element} parentElement - direct parent node to offset scroll
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
  let grandParent, grandParentStyle
  let parent = parentElement

  while (parent.parentElement) {
    // Escape hatch to manually prevent Scroll offset on parents when inside another Scroll view
    if (parent.getAttribute('_no_scroll_offset') != null) break

    grandParent = parent.parentElement
    // Skip offset calculation if the ancestor does not affect layout flow of its siblings, like Modal
    if (!scrollOffsetExclude[getComputedStyle(parent).getPropertyValue('position')]) {
      grandParentStyle = getComputedStyle(grandParent)

      // Also skip offset siblings if grandParent has 'flex-wrap: wrap'
      if (grandParentStyle.getPropertyValue('flex-wrap') !== 'wrap') {
        direction = grandParentStyle.getPropertyValue('flex-direction').replace('-reverse', '')

        // Offset in the direction of grandParent
        if (directions.indexOf(direction) >= 0) {
          for (const sibling of grandParent.children) {
            if (sibling === parent) continue // skip the direct ancestor
            if (sibling.className.split(/\s+/).indexOf(className) >= 0) continue // skip scrollables
            if (scrollOffsetExclude[getComputedStyle(sibling).getPropertyValue('position')]) continue
            offset += (offsetBy[direction] += sibling[attrBy[direction]])
          }
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
