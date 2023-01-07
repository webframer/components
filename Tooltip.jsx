import {
  debounce,
  isFunction,
  isObject,
  subscribeTo,
  toList,
  toUniqueListFast,
  trimSpaces,
  unsubscribeFrom,
} from '@webframer/js'
import cn from 'classnames'
import React, { useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useInstance, useIsomorphicLayoutEffect } from './react/hooks.js'
import { renderProp } from './react/render.js'
import { tooltipProptypes } from './types.js'

/**
 * todo: component improvement 3 - usage without Portal to allow drag event bubbling
 * todo: component improvement 3 - option to toggle tooltip with click, or disable on click
 * todo: component improvement 3 - align tooltip + RTL position support
 * Tooltip Component
 * Notes:
 *  - Offset position should use margin to allow hovering over Tooltip, without loosing mouse hover
 *  - Rendering as Portal to cover use cases, such as absolute positioned parent with transform,
 *    because "position:fixed under something with a transform no longer has fixed behavior"
 *    @see https://stackoverflow.com/a/37953806
 *
 * Side notes;
 *    - Portal elements do not keep hover state on the parent element
 *    when transitioning the cursor from parent to the tooltip.
 *    A test was done to check for the hitNodeFrom event coordinates, but it had flaky results.
 *    The Tooltip from the bottom would not capture the cursor sometimes.
 *    This was not due to CSS margin or gaps, because it did not work even with overlapping padding.
 *    => Need to capture mouse enter event on the tooltip itself with debounce to check open state.
 */
export function Tooltip ({
  position, on: onEvent, open, delay, style, ...props
}) {
  const ref = useRef(null)
  const [self, state] = useInstance({position}) // initially always closed to prerender
  const prerender = state.prerender
  self.props = {open, position}
  const on = useMemo(() => toUniqueListFast(toList(onEvent)), [onEvent])

  // Event Handlers --------------------------------------------------------------------------------
  if (!self.ref) {
    self.ref = (node) => self.node = node
    self.open = () => {
      if (self.canceled || self.state.open || self.willUnmount) return
      self.setState({prerender: true, style: {bottom: 0, right: 0}})
      // ^ first prerender to compute dimensions for positioning
      // (must have bottom + right positions set to work within scroll).
      // The actual opening is called within useLayoutEffect to ensure the prerender has finished.
    }
    self.close = () => {
      if (self.willUnmount) return
      if (self.state.open) self.setState({open: false, prerender: false, style: null})
    }
    self.openDelayed = debounce(self.open, delay)
    self.onHoverEnter = () => {
      self.hasHover = true
      self.canceled = false
      self.openDelayed()
    }
    self.onHoverLeave = debounce(() => {
      self.hasHover = false
      if (self.hasTooltipHover) return
      self.canceled = true
      self.close()
    }, 16) // debounce to capture cursor transition to tooltip
    self.toggleOpenOnClick = (event) => {
      const isTarget = event.target === self.parent
      if (isTarget) { // toggle state when clicking on the parent node directly
        if (self.state.open) self.close()
        else self.open()
      } else if (self.state.open) { // close tooltip if clicking anywhere outside the parent node
        // except for clicking inside the tooltip itself
        let target = event.target
        while (target.parentElement) {
          if (target === self.node) return
          target = target.parentElement
        }
        target = null
        self.close()
      }
    }
    self.enterTooltip = () => self.hasTooltipHover = true
    self.leaveTooltip = debounce(() => {
      self.hasTooltipHover = false
      if (!self.hasHover) self.close()
    }, 16)
  }

  // Register Event Handlers -----------------------------------------------------------------------
  useEffect(() => {
    if (!ref.current) return
    self.parent = ref.current.parentElement
    let eventArgs = [void 0, self.parent]
    let events = on.map((event) => {
      switch (event) {
        // clicking anywhere outside should close the popup (i.e. toggle state on click)
        case 'click':
          subscribeTo('click', self.toggleOpenOnClick)
          return () => unsubscribeFrom('click', self.toggleOpenOnClick)

        // https://www.w3schools.com/jsref/event_onmouseenter.asp
        case 'hover':
          // noinspection JSCheckFunctionSignatures
          subscribeTo('mouseenter', self.onHoverEnter, ...eventArgs)
          // noinspection JSCheckFunctionSignatures
          subscribeTo('mouseleave', self.onHoverLeave, ...eventArgs)
          return () => {
            // noinspection JSCheckFunctionSignatures
            unsubscribeFrom('mouseenter', self.onHoverEnter, ...eventArgs)
            // noinspection JSCheckFunctionSignatures
            unsubscribeFrom('mouseleave', self.onHoverLeave, ...eventArgs)
          }
      }
    })
    return () => events.forEach(unsubscribe => unsubscribe())
  }, [on])
  useEffect(() => {
    self.mounted = true
    if (self.props.open) self.open() // Show Tooltip on mount
    return () => self.willUnmount = true
  }, [])
  useIsomorphicLayoutEffect(() => {
    if (!prerender || !self.parent || !self.node) return
    self.setState({prerender: false, open: true, ...positionFrom(self.node, self.parent, self.props.position)})
  }, [prerender])

  // Render Props ----------------------------------------------------------------------------------
  const shouldRender = self.mounted && (prerender || state.open)
  if (state.style) style = style ? {...style, ...state.style} : state.style

  return (
    <span style={hidden} ref={ref}>
      {shouldRender && createPortal(
        <TooltipRender {...props} {...state} on={on} style={style} self={self} />,
        document.body,
      )}
    </span>
  )

  // Archived version: using absolute position
  // return ( // Outer div is required to take full size of the parent element for positioning
  //   <span className={cn(
  //     'tooltip row', `theme-${theme}`,
  //     !prerender && `from-${position} ${alignClass(align, position)} position-fill`,
  //   )} ref={ref} style={prerender ? styleFixed : noPointerEvents}>
  //     {/**
  //      This extra middle div fixes {width/height: fit-content} problem for Safari and serves
  //      as the container to retain hover state when user wants to hover over the tooltip.
  //      Offset position is created by adding padding to this div via tooltip.less file.
  //      @note: 'position-fixed', instead of 'absolute' is required for 'from-right' CSS to work,
  //      otherwise, text collapses in width due to overflow.
  //      => setting 'position-fixed' without top/left/right/bottom behaves like position absolute
  //      (i.e. relative to the parent element), but allows z-index to override ancestors' siblings
  //      => However, position fixed does not work for scrolled elements, it stays in the original
  //      position even if the parent element has moved.
  //      */
  //       self.mounted && (prerender || open) && // Skip rendering when closed for performance
  //       <span className={cn('col', {'position-fixed': !prerender})}
  //             style={open ? styleTooltip : noPointerEvents}>
  //       {/* Inner div behaves like View.jsx - tooltip pointer can be added to this */}
  //         <span className={cn(className, 'tooltip__content', {
  //           col, row, fill, reverse, rtl,
  //           left, right, top, bottom, center, middle,
  //           'pointer': props.onClick,
  //           'invisible': prerender, // tailwind only recognizes text literal
  //           [animation]: open && !prerender,
  //         })} {...props}>
  //         {renderProp(children, self)}
  //       </span>
  //     </span>
  //     }
  //   </span>
  // )
}

Tooltip.propTypes = tooltipProptypes

Tooltip.defaultProps = {
  animation: 'fade-in',
  delay: 1000,
  on: ['hover', 'click'],
  position: 'top',
  theme: 'dark',
  role: 'tooltip',
}

let ToolTip
export default ToolTip = React.memo(Tooltip)

function TooltipRender ({
  open, position, prerender, self, // props from state
  animation, on, theme, align = (position === 'left' || position === 'right') ? 'middle' : 'center',
  className, style, row, col = !(row), fill, reverse, rtl,
  left, right, top, bottom, center, middle,
  children, ...props
}) {

  useEffect(() => {
    if (!self.node) return
    let eventArgs = [void 0, self.node]
    let events = on.filter(e => e === 'hover').map(() => {
      // noinspection JSCheckFunctionSignatures
      subscribeTo('mouseenter', self.enterTooltip, ...eventArgs)
      // noinspection JSCheckFunctionSignatures
      subscribeTo('mouseleave', self.leaveTooltip, ...eventArgs)
      return () => {
        // noinspection JSCheckFunctionSignatures
        unsubscribeFrom('mouseenter', self.enterTooltip, ...eventArgs)
        // noinspection JSCheckFunctionSignatures
        unsubscribeFrom('mouseleave', self.leaveTooltip, ...eventArgs)
      }
    })
    return () => events.forEach(unsubscribe => unsubscribe())
  }, [on])

  return (
    <div className={cn('tooltip col position-fixed', `theme-${theme}`,
      !prerender && `tooltip-${position} tooltip-${align}`,
      open ? 'pointer-events-auto z-10' : 'pointer-events-none', {
        'invisible': prerender, // tailwind only recognizes text literal
        [animation]: open && !prerender,
      })} style={style} ref={self.ref}>
      <div className={cn(className, 'tooltip__content', {
        col, row, fill, reverse, rtl, left, right, top, bottom, center, middle,
        pointer: props.onClick && props.tabIndex !== -1,
      })} {...props}>{renderProp(children, self)}
      </div>
    </div>
  )
}

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

function eventsFromProp (on) {
  return toUniqueListFast(trimSpaces(on).toLowerCase().split(',').map(e => e.trim()))
}

/**
 * Compute correct Tooltip position to try to fit it within viewport
 * @param {Element} node - the Tooltip outer div element
 * @param {Element} parentElement - the Tooltip container
 * @param {string} position - desired initially
 * @param {number} [offset] - to account for Tooltip offset position and pointer
 * @returns {{position: string, style: object}} state - props for optimum placement
 */
function positionFrom (node, parentElement, position, offset = 15) {
  // The outer div can have 0 height if Tooltip children is an inline element.
  // Use .tooltip__content div to guarantee correct Tooltip dimensions.
  // offsetHeight/offsetWidth dimensions may be incorrect within scroll, make sure the outer div has
  // fixed bottom and right positions set to 0 during the prerender phase.
  const {offsetHeight, offsetWidth} = node.children[0]
  const {top, left, bottom, right, width, height} = parentElement.getBoundingClientRect()
  const {innerWidth, innerHeight} = window
  const _bottom = innerHeight - Math.max(0, top + height) // available space from the edge of viewport
  const _right = innerWidth - Math.max(0, left + width) // available space from the edge of viewport
  position = positionComputed(position, top, _bottom, left, _right, offsetWidth, offsetHeight, offset)

  // Besides the position direction, the tooltip also needs coordinates along the other axis.
  // By default, try to place it in the center/middle, then restrict to be within viewport.
  let style
  switch (position) {
    case 'left':
    case 'right':
      style = {top: Math.max(0, top + height / 2 - offsetHeight / 2)}
      style.top = Math.min(innerHeight - offsetHeight, style.top) // prevent bottom clipping
      if (position === 'left') style.right = innerWidth - left
      if (position === 'right') style.left = right
      return {position, style}
    case 'bottom':
    case 'top':
    default:
      style = {left: Math.max(0, left + width / 2 - offsetWidth / 2)}
      style.left = Math.min(innerWidth - offsetWidth, style.left) // prevent right clipping
      if (position === 'bottom') style.top = bottom
      if (position === 'top') style.bottom = innerHeight - top
      return {position, style}
  }
}

function positionComputed (position, top, bottom, left, right, offsetWidth, offsetHeight, offset) {
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

const hidden = {display: 'none'}
