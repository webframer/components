import {
  debounce,
  isFunction,
  isObject,
  subscribeTo,
  toUniqueListFast,
  trimSpaces,
  unsubscribeFrom,
} from '@webframer/js'
import cn from 'classnames'
import React, { useEffect, useRef } from 'react'
import { useInstance } from './react/hooks.js'
import { type } from './types.js'

/**
 * todo: component improvement 3 - align tooltip
 * Tooltip Component
 * @notes:
 *  - Offset position should use margin to allow hovering over Tooltip
 */
export function Tooltip ({
  position, on, open, delay, animation, theme,
  align = (position === 'left' || position === 'right') ? 'middle' : 'center',
  className, row, col = !(row), fill, reverse, rtl,
  left, right, top, bottom, center, middle,
  children, ...props
}) {
  const ref = useRef(null)
  const [self, state] = useInstance({open, position})
  open = state.open
  position = state.position

  if (!self.openDelayed) self.openDelayed = debounce(() => {
    if (self.canceled) return
    self.setState({open: true, position: positionFrom(ref.current, position)})
  }, delay)

  if (!self.openOnHover) self.openOnHover = () => {
    self.canceled = false
    self.openDelayed()
  }

  if (!self.closeOnHover) self.closeOnHover = () => {
    self.canceled = true
    if (self.state.open) self.setState({open: false})
  }

  if (!self.toggleOpenOnClick) self.toggleOpenOnClick = (event) => {
    const isTarget = event.target === self.parent
    if (isTarget) { // toggle state when clicking on the parent node directly
      const open = !self.state.open
      self.setState({open, position: open ? positionFrom(ref.current, position) : self.state.position})
    } else if (self.state.open) { // close tooltip if clicking anywhere outside the parent node
      // except for clicking inside the tooltip itself
      let target = event.target
      while (target.parentElement) {
        if (target === ref.current) return
        target = target.parentElement
      }
      target = null
      self.setState({open: false})
    }
  }

  // For now, only register events on component mount,
  // because the use cases for changing tooltip behavior after mounting is rare.
  useEffect(() => {
    self.mounted = true
    if (!ref.current) return

    // Show Tooltip on mount after calculating the correct position
    if (open) {
      const pos = positionFrom(ref.current, position)
      if (pos !== position) {
        self.setState({position: pos})
      } else {
        self.forceUpdate()
      }
    } // If Tooltip is not open initially, no need to re-render, the next interaction will update it

    self.parent = ref.current.parentElement
    let eventArgs = [void 0, self.parent]
    let events = toUniqueListFast(trimSpaces(on).split(' ')).map((event) => {
      switch (event) {
        // clicking anywhere outside should close the popup (i.e. toggle state on click)
        case 'click':
          subscribeTo(event, self.toggleOpenOnClick)
          return () => unsubscribeFrom(event, self.toggleOpenOnClick)

        // https://www.w3schools.com/jsref/event_onmouseenter.asp
        case 'hover':
          // noinspection JSCheckFunctionSignatures
          subscribeTo('mouseenter', self.openOnHover, ...eventArgs)
          // noinspection JSCheckFunctionSignatures
          subscribeTo('mouseleave', self.closeOnHover, ...eventArgs)
          return () => {
            // noinspection JSCheckFunctionSignatures
            unsubscribeFrom('mouseenter', self.openOnHover, ...eventArgs)
            // noinspection JSCheckFunctionSignatures
            unsubscribeFrom('mouseleave', self.closeOnHover, ...eventArgs)
          }
      }
    })
    return () => events.forEach(unsubscribe => unsubscribe())
  }, [])

  return ( // Outer div is required to take full size of the parent element for positioning
    <span className={cn(
      'tooltip row', `theme-${theme}`,
      self.mounted && `from-${position} ${alignClass(align, position)} position-fill`,
    )} ref={ref} style={self.mounted ? noPointerEvents : styleFixed}>
      {/**
       This extra middle div fixes {width/height: fit-content} problem for Safari and serves
       as the container to retain hover state when user wants to hover over the tooltip.
       Offset position is created by adding padding to this div via tooltip.less file.
       @note: 'position-fixed', instead of 'absolute' is required for 'from-right' CSS to work,
       otherwise, text collapses in width due to overflow.
       => setting 'position-fixed' without top/left/right/bottom behaves like position absolute
       (i.e. relative to the parent element), but allows z-index to override ancestors' siblings
       */}
      <span className={cn('col', {'position-fixed': self.mounted})}
            style={open ? styleTooltip : noPointerEvents}>
        {/* Inner div behaves like View.jsx - tooltip pointer can be added to this */}
        <span className={cn(className, 'padding-small padding-v-smaller radius', {
          col, row, fill, reverse, rtl,
          left, right, top, bottom, center, middle,
          'pointer': props.onClick,
          'invisible': !self.mounted || !open, // tailwind only recognizes text literal
          [animation]: self.mounted && open,
        })} {...props}>
          {isFunction(children) ? children(self) : children}
        </span>
      </span>
    </span>
  )
}

Tooltip.propTypes = {
  // One of, or any combination of: 'hover', 'click' - separated by space
  on: type.String,
  // Tooltip alignment relative to the `position`, default is center/middle alignment.
  //  - `start === 'left'` and `end === 'right'` if position is 'top' or 'bottom'
  //  - `start === 'top'` and `end === 'bottom'` if position is 'left' or 'right'
  align: type.Enum(['start', 'end']),
  // Location of the Tooltip relative to the parent element
  position: type.Enum(['top', 'right', 'bottom', 'left']),
}

Tooltip.defaultProps = {
  animation: 'fade-in',
  delay: 700,
  on: 'hover',
  open: false,
  position: 'top',
  theme: 'dark',
  role: 'tooltip',
}

let ToolTip
export default ToolTip = React.memo(Tooltip)

/**
 * Convert `tooltip` prop of any type into props for Tooltip rendering.
 *
 * @param {any} tooltip - prop
 * @param {object|null} [defaultProps] - to use for Tooltip
 * @returns {object|null} props - ready for use with Tooltip component
 */
export function tooltipProps (tooltip, defaultProps) {
  if (tooltip == null) return null
  if (React.isValidElement(tooltip) || isFunction(tooltip)) return {...defaultProps, children: tooltip}
  if (isObject(tooltip)) return defaultProps ? {...defaultProps, ...tooltip} : tooltip
  // Tooltip is a primitive value
  return {...defaultProps, children: String(tooltip)}
}

/**
 * Extend a Component with `tooltip` prop.
 * @example:
 *    const [tooltip] = useTooltip(props)
 *
 *    // Tooltip will open when hovering over `div` by default
 *    return <div>{children}{tooltip}</div>
 *
 * @param {object|{tooltip?: any}} props - copy of the Component with optional `tooltip` prop
 * @param {object|null} [defaultProps] - to use for Tooltip
 * @returns [tooltip: JSX.Element|null] - tooltip variable for inserting into markup
 */
export function useTooltip (props, defaultProps) {
  if (props.tooltip == null) return [null]
  const tooltip = tooltipProps(props.tooltip, defaultProps)
  delete props.tooltip
  return [<ToolTip {...tooltip} />]
}

// Render Tooltip as fixed position initially to measure its desired width/height
const styleFixed = {position: 'fixed', right: 0, bottom: 0, visibility: 'hidden'}
const styleTooltip = {zIndex: 99, pointerEvents: 'auto'}
const noPointerEvents = {pointerEvents: 'none'}

// Convert Tooltip `align` props to flex layout alignment CSS className
function alignClass (align, position) {
  switch (position) {
    case 'left':
    case 'right':
      switch (align) {
        case 'start':
          return 'top'
        case 'end':
          return 'bottom'
        default:
          return 'middle'
      }

    case 'top':
    case 'bottom':
    default:
      switch (align) {
        case 'start':
          return 'left'
        case 'end':
          return 'right'
        default:
          return 'center'
      }
  }
}

/**
 * Compute correct Tooltip position to try to fit it within viewport
 * @param {Element} node - the Tooltip outer div element
 * @param {string} position - desired initially
 * @param {number} [offset] - to account for Tooltip offset position and pointer
 * @returns {string} position - for optimum placement
 */
function positionFrom (node, position, offset = 15) {
  // The middle div can have 0 height if Tooltip children is an inline element.
  // Use inner div to guarantee correct Tooltip dimensions.
  let {offsetHeight, offsetWidth} = node.children[0].children[0]
  const {top, left, width, height} = node.parentElement.getBoundingClientRect()
  const {innerWidth, innerHeight} = window
  const bottom = innerHeight - Math.max(0, top + height) // available space from the edge of viewport
  const right = innerWidth - Math.max(0, left + width) // available space from the edge of viewport
  offsetHeight += offset
  offsetWidth += offset

  // The logic can get very complicated if we try to always render the Tooltip within viewport.
  // Instead, only check if enough space is available for given position direction.
  // For example: if not enough top space, try to position to the bottom, else right/left, or revert.
  // noinspection FallThroughInSwitchStatementJS
  switch (position) {
    case 'top':
      if (top > offsetHeight) return position
      if (bottom > offsetHeight) return 'bottom'
    case 'bottom':
      if (bottom > offsetHeight) return position
      if (top > offsetHeight) return 'top'
    case 'left':
      if (left > offsetWidth) return position
      if (right > offsetWidth) return 'right'
    case 'right':
      if (right > offsetWidth) return position
      if (left > offsetWidth) return 'left'
    default: // fallback in this order if other desired orders not met
      if (top > offsetHeight) return 'top'
      if (bottom > offsetHeight) return 'bottom'
      if (right > offsetWidth) return 'right'
      if (left > offsetWidth) return 'left'
      return position
  }
}
