import { hasProp, isString, merge, throttle, toUniqueListFast } from '@webframer/js'
import cn from 'classnames'
import React from 'react'
import { accessibilitySupport, assignRef, isRef, useInstance, useIsomorphicLayoutEffect } from './react.js'
import { renderProp } from './react/render.js'
import { useTooltip } from './Tooltip.js'
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
    row, col = !(row), grid, fill, reverse, rtl,
    left, right, top, bottom, center, middle, sound,
    className, children, childBefore, childAfter, preventOffset, _ref,
    scroll, scrollClass, scrollStyle, scrollAlongDirectionOnly, scrollRef, scrollProps,
    scrollOffset, scrollOverflowProps, reverseScroll,
    ...props
  }, ref) {
    const [tooltip] = useTooltip(props)
    props = accessibilitySupport(props, sound)
    if (isRef(ref)) props.ref = ref // forwarded ref may not exist on mount
    else if (_ref) props.ref = _ref // preferred way to ensure ref exists on mount
    if (preventOffset) props._no_offset = ''

    // Ordinary View
    if (!(scroll)) {
      className = cn(
        className, {
          col, row, fill, reverse, rtl,
          left, right, top, bottom, center, middle,
          pointer: props.onClick && props.tabIndex !== -1,
        },
      )
      return <div className={className} {...props}>{children}{tooltip}</div>
    }

    // Scrollable View =============================================================================
    // The wrapper should get rest props by default, because that's the expected behavior
    const [self, overflowProps] = useInstance()
    if (!self.ref) self.ref = function (node) {
      if (self.props.ref) assignRef.call(this, self.props.ref, ...arguments)
      self.node = node
    }
    if (hasProp(props, '_id')) {
      Object.assign(props, {_nodrop: ''})
      scrollProps = Object.assign({}, scrollProps, {_id: props._id, _nodrag: ''})
    }
    self.props = props

    // Overflow Props ------------------------------------------------------------------------------
    if (!self.onScroll) {
      self.onScroll = function (e) {
        const {onScroll} = self.props
        if (onScroll) onScroll.apply(this, arguments)
        if (e.defaultPrevented) return
        self.setScrollPropsDebounced()
      }
      self.setScrollProps = function () {
        if (!self.node || !self.scrollOverflowProps) return
        let {scrollWidth, scrollHeight, clientWidth, clientHeight, scrollTop, scrollLeft} = self.node
        const {scrollAlongDirectionOnly, scrollOverflowProps: {top, left, right, bottom}} = self
        // Compute rtl directly from the node, because it could inherit style from parent nodes
        const rtl = getComputedStyle(self.node).getPropertyValue('direction') === 'rtl'
        scrollTop = Math.abs(scrollTop)
        scrollLeft = Math.abs(scrollLeft) // rtl direction has negative scroll
        let overflowProps = []
        // Scroll area does not include border, it is within padding-box
        if (scrollAlongDirectionOnly) {
          switch (self.row) { // use prop `row` because Scroll may have display 'block', not flex
            case true: // row
              if (scrollWidth > clientWidth) {
                if (scrollLeft >= 1) overflowProps.push(rtl ? right : left)
                if (Math.ceil(scrollLeft + clientWidth) < scrollWidth)
                  overflowProps.push(rtl ? left : right)
              }
              break
            case false: // column
            default:
              if (scrollHeight > clientHeight) {
                if (scrollTop >= 1) overflowProps.push(top)
                if (Math.ceil(scrollTop + clientHeight) < scrollHeight)
                  overflowProps.push(bottom)
              }
          }
        } else {
          if (scrollHeight > clientHeight) {
            if (scrollTop >= 1) overflowProps.push(top)
            if (Math.ceil(scrollTop + clientHeight) < scrollHeight)
              overflowProps.push(bottom)
          }
          if (scrollWidth > clientWidth) {
            if (scrollLeft >= 1) overflowProps.push(rtl ? right : left)
            if (Math.ceil(scrollLeft + clientWidth) < scrollWidth)
              overflowProps.push(rtl ? left : right)
          }
        }
        // Merge props
        overflowProps = overflowProps.filter(v => v)
        let classNames = overflowProps.map(props => props.className).filter(v => v)
        classNames = toUniqueListFast(classNames).join(' ')
        overflowProps = merge(...overflowProps)
        overflowProps.className = classNames
        self.setState(overflowProps)
      }
      self.setScrollPropsDebounced = throttle(self.setScrollProps, 100, {trailing: true})
    }
    useIsomorphicLayoutEffect(() => {
      if (scrollOverflowProps) self.setScrollProps()
    }, [scrollOverflowProps])
    if (scrollOverflowProps) Object.assign(props, overflowProps)
    self.scrollAlongDirectionOnly = scrollAlongDirectionOnly
    self.scrollOverflowProps = scrollOverflowProps === true ? overflowScrollProps : scrollOverflowProps
    self.row = row

    // Scroll Offset ------------------------------------------------------------------------------
    // max-height/width calculation for direct parent element
    useIsomorphicLayoutEffect(() => {
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

    // // @archive: position absolute version
    // // CSS styles required:
    // // .col > .scrollable,
    // // .row > .scrollable {
    // //   flex: 1;
    // // }
    // // ```
    // className = cn(className, 'scrollable', {col, row, fill, rtl})
    // scrollClass = cn({'position-fill': scroll})

    // @Flexbox version ----------------------------------------------------------------------------
    className = cn( // outer div container
      className, 'scroll', props.className, {
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

    if (grid) {
      scrollClass = cn(scrollClass, 'wrap')
      row = !(row)
      col = !(row)
    }

    // Allow override for inner direction
    if (scrollProps && scrollProps.row != null) {
      scrollProps = {...scrollProps}
      row = scrollProps.row
      col = !(row)
      delete scrollProps.row
    }

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
        pointer: props.onClick && props.tabIndex !== -1,
        'margin-auto-h': center, // when layout is row and inner div is smaller than outer
        'margin-auto-v': middle, // when layout is col and inner div is smaller than outer
      },
    )
    delete props.className

    // Scroll View
    return (
      <div className={className} {...props} ref={self.ref} onScroll={self.onScroll}>
        {renderProp(childBefore, self)}
        <div className={scrollClass} style={scrollStyle} ref={scrollRef}
             {...preventOffset && {_no_offset: ''}} {...scrollProps}>
          {children}
        </div>
        {renderProp(childAfter, self)}
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
    // Whether to render as grid with automatic items distribution using flex wrap
    grid: type.Boolean,
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
    // Custom UI to render before `children` in Scroll mode (outside inner Scroll component)
    childBefore: type.NodeOrFunction,
    // Custom UI to render after `children` in Scroll mode (outside inner Scroll component)
    childAfter: type.NodeOrFunction,
    // Ref for the View or outer Scroll container
    _ref: type.Ref,
    /**
     * Whether to prevent components from setting size offset for this component.
     * This can prevent bugs caused by children Scroll components with `scrollOffset` enabled.
     */
    preventOffset: type.Boolean,
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
    // Props for outer Scroll div when content overflows in given direction, set `false` to disable
    scrollOverflowProps: type.OneOf([
      type.Obj({
        top: type.Props,
        bottom: type.Props,
        left: type.Props,
        right: type.Props,
      }),
      type.Boolean,
    ]),
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
 * Extract key->value pairs from `props` object by mutation, returning new object of extracted keys
 * as defined in `propTypes`.
 *
 * @example:
 *    function Component ({...props}) {
 *      return (
 *        <View {...extractProps(props)}>
 *          // The `props` now has View.jsx props removed
 *          <OtherComponent {...props}/>
 *        </View>
 *      )
 *    }
 *
 * @param {object} props - original Component props
 * @param {object} [keys] - object keys config:
 *    - keys with `false` values are skipped (left in `props`),
 *    - keys with `null` values are deleted from `props` without inclusion in the `result` object,
 *    - `undefined` keys or keys with `true` values are deleted from `props` and assigned to `result`
 * @param {object} [propTypes] - Component.propTypes definition to extract props for
 * @returns {object} result - props to use with Component.jsx, with keys removed from the original `props`
 */
export function extractProps (props, keys = {}, propTypes = View.propTypes) {
  const viewProps = {}
  for (const key in propTypes) {
    if (keys[key] === false || !hasProp(props, key)) continue
    if (keys[key] !== null) viewProps[key] = props[key]
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
    if (parent.getAttribute('_no_offset') != null) break

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

export const overflowScrollProps = {
  top: {className: 'fade-top'},
  bottom: {className: 'fade-bottom'},
  left: {className: 'fade-left'},
  right: {className: 'fade-right'},
}
const scrollOffsetExclude = {
  'absolute': true,
  'fixed': true,
}
const attrBy = {
  'column': 'offsetHeight',
  'row': 'offsetWidth',
}
