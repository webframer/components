import { hasProp, isString } from '@webframer/js'
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
   */
  function View ({
    row, col = !(row), fill, reverse, rtl,
    left, right, top, bottom, center, middle, sound,
    className, children, _ref,
    scroll, scrollClass, scrollStyle, scrollAlongDirectionOnly, scrollRef, scrollProps,
    scrollOffset, reverseScroll,
    ...props
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
    let {style, ..._props} = props
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
        'reverse-scroll': reverseScroll,
        '!overflow-x-hidden': scrollAlongDirectionOnly && !(row),
        '!overflow-y-hidden': scrollAlongDirectionOnly && row,
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
      if (!scrollOffset) return
      if (!self.node.parentElement) return
      let attr = maxSizeScrollOffset(self.node.parentElement, scrollOffset)
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
        <div className={scrollClass} style={scrollStyle} ref={scrollRef} {...scrollProps}>
          {children}
        </div>
        {tooltip}
      </div>
    )
  }

  const ViewRef = React.forwardRef(View)

  if (defaultProp) View.defaultProps = ViewRef.defaultProps = {[defaultProp]: true}

  View.propTypes = ViewRef.propTypes = {
    // CSS class names separated by space
    className: type.ClassName,
    // CSS style object with camelCase attribute keys
    style: type.Style,
    // Whether to use column layout, true if `row` is falsy by default
    col: type.Boolean,
    // Whether to use row layout, column by default
    row: type.Boolean,
    // Whether to make the view fill up available height and width
    fill: type.Boolean,
    // Whether to reverse the order of rendering
    reverse: type.Boolean,
    /**
     * Whether to use right to left scroll direction and place the scrollbar on the left.
     *  - If `rtl` is true, the scroll direction is left to right and the scrollbar is on the right.
     *  - To achieve left scrollbar without changing horizontal scroll direction,
     *    restrict this Scroll component to allow only vertical scroll,
     *    then create a nested Scroll component that can only scroll horizontally.
     * @example:
     *  <Scroll rtl={rtl} reverseScroll scrollAlongDirectionOnly>
     *     <Scroll row scrollAlongDirectionOnly>...</Scroll>
     *  </Scroll>
     */
    reverseScroll: type.Boolean,
    // Whether to use right to left text, layout, and scroll direction
    rtl: type.Boolean,
    // Align inner content to the start
    left: type.Boolean,
    // Align inner content to the end
    right: type.Boolean,
    // Align inner content to the top
    top: type.Boolean,
    // Align inner content to the bottom
    bottom: type.Boolean,
    // Align inner content to the center horizontally
    center: type.Boolean,
    // Align inner content to the middle vertically
    middle: type.Boolean,
    // @param {object|HTMLAudioElement} new Audio(URL) sound file to play on click
    sound: type.Object,
    // Inner content to render
    children: type.Node,
    // Ref for the View or outer Scroll container
    _ref: type.Ref,
    // Whether to make the View scrollable
    scroll: type.Boolean,
    // Whether to restrict scrolling along the layout direction.
    // Scrollable in all directions by default.
    scrollAlongDirectionOnly: type.Boolean,
    // CSS class for inner wrapper Scroll component
    scrollClass: type.ClassName,
    // CSS style for inner wrapper Scroll component
    scrollStyle: type.Style,
    // Ref for the inner Scroll component
    scrollRef: type.Ref,
    // Props for the inner Scroll component
    scrollProps: type.Object,
    // Whether to allow Scroll element to set offset style to its parent element.
    // The Scroll component may set max-width or max-height style to the parent
    // element in order for it to calculate the maximum available space correctly.
    // Sometimes, this behavior leads to false positives, and needs to be disabled.
    scrollOffset: type.OneOf([type.Boolean, type.Enum(['height', 'width'])]),
    // Tooltip props or value to display as tooltip on hover
    tooltip: type.Tooltip,
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
 * Extract View.jsx props from `props` object by mutation
 * @example:
 *    function Component ({...props}) {
 *      return (
 *        <View {...extractViewProps(props)}>
 *          // The `props` now has View.jsx props removed
 *          <OtherComponent {...props}/>
 *        </View>
 *      )
 *    }
 *
 * @param {object} props - original Component props
 * @returns {object} props - to use with View.jsx, with keys removed from the original `props`
 */
export function extractViewProps (props) {
  const viewProps = {}
  for (const key in View.propTypes) {
    if (!hasProp(props, key)) continue
    viewProps[key] = props[key]
    delete props[key]
  }
  return viewProps
}

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
 * @param {string|boolean} [side] - one of 'height' or 'width' (or `true` for both) to offset
 * @param {string} [className] - to identify the Scroll component
 * @param {string} [attr] - attribute key to store the original parentElement.style for reset later
 * @returns {string|void} attribute - modified style attribute that was attached to parentElement
 */
export function maxSizeScrollOffset (parentElement, side, className = 'scroll', attr = '@scrollReset') {
  if (parentElement === document.body) return

  // Scroll offset style only works when set to the parent or higher up nested grandparents.
  // The offset must be in the direction of the scroll, not the parent.
  // Offset amount must be accumulated from parent siblings, grandparent siblings, and so on...
  // Offset should not take in account `absolute` and `fixed` sibling elements.
  let directions = isString(side) ? (side === 'width' ? ['row'] : ['column']) : ['column', 'row']
  let offsetBy = directions.reduce((obj, val) => ((obj[val] = 0) || obj), {})
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
const attrBy = {
  'column': 'offsetHeight',
  'row': 'offsetWidth',
}
