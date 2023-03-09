import { debounce, isFunction, isObject, subscribeTo, trimSpaces, unsubscribeFrom } from '@webframer/js'
import { toList, toUniqueListFast } from '@webframer/js/array.js'
import cn from 'classnames'
import React, { useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useInstance, useIsomorphicLayoutEffect } from './react/hooks.js'
import { renderProp } from './react/render.js'
import { tooltipProptypes } from './types.js'

/**
 * Tooltip Component
 * todo: component improvement 3 - RTL position/align support
 *
 * Logic:
 *  - `on='click'` toggles Tooltip when clicking inside the parent element,
 *    but not inside the Tooltip itself; and closes it when clicking outside,
 *    independent of the `focus` or `hover` states. By default, on `click` toggle is disabled,
 *    and closes the Tooltip when clicking anywhere, except inside the Tooltip.
 *
 *  - `on='focus`` opens Tooltip with specified delay when the parent element receives focus
 *    (except when focus is the result of the `click` event),
 *    and closes it on blur (unless the parent element is hovered and has on `hover` enabled).
 *    todo: component improvement 3 - complex logic for on blur events checks if the focused element
 *          is inside Tooltip and keeps it open. Then it subscribes to the focused element for
 *          on blur events to know when to close the Tooltip. If after blur of that element
 *          the parent did not get focus, then close the Tooltip.
 *
 *  - `on='hover` opens Tooltip with specified delay when the pointer enters the parent element,
 *    and closes it on pointer leave (unless the pointer enters the Tooltip itself,
 *    or the parent element has focus and on `focus` is enabled).
 *
 *  - `embedded={true}` renders Tooltip inside the parent element. By default, Tooltip renders
 *    inside a Portal, as direct child of document.body to ensure position-fixed works as expected.
 *
 * Notes:
 *  - Offset position should use margin to allow hovering over Tooltip, without loosing mouse hover
 *  - Rendering as Portal to cover use cases, such as absolute positioned parent with transform,
 *    because "position:fixed under something with a transform no longer has fixed behavior"
 *    @see https://stackoverflow.com/a/37953806
 *
 * Side notes;
 *    - Portal elements do not keep hover state on the parent element
 *    when transitioning the cursor from parent to the Tooltip.
 *    A test was done to check for the hitNodeFrom event coordinates, but it had flaky results.
 *    The Tooltip from the bottom would not capture the cursor sometimes.
 *    This was not due to CSS margin or gaps, because it did not work even with overlapping padding.
 *    => Need to capture mouse enter event on the tooltip itself with debounce to check open state.
 */
export function Tooltip ({
  position, on: onEvent, offset, open, onOpen, onClose, onMount, delay, embedded, style, ...props
}) {
  const ref = useRef(null) // empty span container embedded inside the parent element
  const [self, state] = useInstance({position}) // initially always closed to prerender
  const prerender = state.prerender
  const on = useMemo(() => toUniqueListFast(['click', ...toList(onEvent)]), [onEvent])

  // Event Handlers --------------------------------------------------------------------------------
  if (!self.props) {
    // Timestamp of cancel event to prevent Tooltip from opening (ie. after delay)
    self.canceledOpen = 0

    // Tooltip node
    self.ref = (node) => {self.node = node}

    // Open Tooltip
    self.open = function (e) {
      if (e.defaultPrevented) return // alert may prevent opening
      if (self.state.open || self.willUnmount) return
      const {delay, onOpen} = self.props
      if (Date.now() - self.canceledOpen < delay) return
      if (onOpen) onOpen.call(this, e, self)
      if (e.defaultPrevented) return
      self.setState({prerender: true, style: {bottom: 0, right: 0}})
      // ^ first prerender to compute dimensions for positioning
      // (must have bottom + right positions set to work within scroll).
      // The actual opening is called within useLayoutEffect to ensure the prerender has finished.
    }

    // Close Tooltip
    self.close = function (e) {
      if (e.defaultPrevented) return // alert may prevent closing
      if (!self.state.open || self.willUnmount) return
      const {onClose} = self.props
      if (onClose) onClose.call(this, e, self)
      if (e.defaultPrevented) return
      self.setState({open: false, prerender: false, style: null})
    }

    // Handle click events
    self.onClickAnywhere = function (e) {
      // For Button with Icon and Tooltip, the target is the Icon -> consider it as target as well.
      // If needed, create `directClickOnly` prop to only consider direct target element
      let isInsideParent = e.target === self.parent

      // Ignore clicks inside the Tooltip itself
      if (!isInsideParent) {
        let target = e.target
        while (target.parentElement) {
          if (target === self.node) return
          if ((isInsideParent = target === self.parent)) break
          target = target._parentElement || target.parentElement
        }
        target = null
      }

      // Toggle state when clicking inside the parent element and on `click` enabled
      if (isInsideParent && toList(self.props.on).includes('click')) {
        if (self.state.open) {
          self.close.apply(this, arguments)
          self.canceledOpen = Date.now() // prevent focus/hover from reopening after delay
        } else {
          self.canceledOpen = 0 // force open regardless on focus/hover states
          self.open.apply(this, arguments)
        }
      }

      // Close and prevent opening Tooltip if clicking anywhere outside or when on `click` is disabled
      else {
        if (self.state.open) self.close.apply(this, arguments)
        self.canceledOpen = Date.now() // prevent focus/hover from reopening after delay
      }
    }

    // Handle focus events on the parent element
    self.onFocusEnter = function (e) {
      self.hasFocus = true
      self.openDelayed.apply(this, arguments)
    }

    // Handle blur events on the parent element
    self.onFocusLeave = function (e) {
      self.hasFocus = false
      if (self.hasHover) return
      self.canceledOpen = Date.now()
      self.close.apply(this, arguments)
    }

    // Handle pointer enter events on the parent element
    self.onHoverEnter = function (e) {
      self.hasHover = true
      self.openDelayed.apply(this, arguments)
    }

    // Handle pointer leave events on the parent element
    self.onHoverLeave = debounce(function (e) {
      self.hasHover = false
      if (self.hasFocus || self.hasTooltipHover) return
      self.canceledOpen = Date.now()
      self.close.apply(this, arguments)
    }, 16) // debounce to capture cursor transition to tooltip

    // Handle pointer enter events on the Tooltip
    self.enterTooltip = function (e) {
      self.hasTooltipHover = true
    }

    /**
     * Handle pointer leave events on the Tooltip
     * Note:
     *  - when the cursor hovers over a scrollbar, it will cause `pointerleave` event on the Tooltip,
     *    no matter which z-index the Tooltip has, or if it's rendered directly inside the `<body>`
     *  - The fix is to check if the cursor is over the Tooltip node on `pointerleave`
     *  - However, this may cause the Tooltip to never receive `pointerleave` event, if the cursor
     *    enters scrollbar while inside Tooltip, and leaves Tooltip while in scrollbar area.
     *    => this is not a big problem most of the time, because users can click or hover again.
     *    => it is also the desired UX for multilevel nested dropdowns that open on `hover`,
     *       where pointer leaving the nested dropdown should keep parent dropdowns open.
     */
    self.leaveTooltip = debounce(function ({clientX, clientY}) {
      if (self.node) {
        // Using `hitNodeFrom` is not reliable over scrollbar, use coordinates instead
        const {top, left, right, bottom} = self.node.getBoundingClientRect()
        if ( // clientX and clientY are rounded, while rect sizes are not
          Math.round(left) < clientX && clientX < Math.round(right) &&
          Math.round(top) < clientY && clientY < Math.round(bottom)
        ) return
      }
      self.hasTooltipHover = false
      if (!self.hasFocus && !self.hasHover) self.close.apply(this, arguments)
    }, 16)
  }
  self.openDelayed = useMemo(() => debounce(self.open, delay), [delay])
  self.props = arguments[0]

  // Register Event Handlers -----------------------------------------------------------------------
  useEffect(() => {
    if (!ref.current) return
    self.parent = ref.current.parentElement
    delete self.hasFocus // ensure proper reset when `on` event subscription changes
    delete self.hasHover
    const eventArgs = [void 0, self.parent]
    const events = on.map((event) => {
      switch (event) {
        // clicking anywhere outside should close the popup (i.e. toggle state on click)
        case 'click':
          subscribeTo('click', self.onClickAnywhere)
          return () => unsubscribeFrom('click', self.onClickAnywhere)

        case 'focus':
          // noinspection JSCheckFunctionSignatures
          subscribeTo('focus', self.onFocusEnter, ...eventArgs)
          // noinspection JSCheckFunctionSignatures
          subscribeTo('blur', self.onFocusLeave, ...eventArgs)
          return () => {
            // noinspection JSCheckFunctionSignatures
            unsubscribeFrom('focus', self.onFocusEnter, ...eventArgs)
            // noinspection JSCheckFunctionSignatures
            unsubscribeFrom('blur', self.onFocusLeave, ...eventArgs)
          }

        case 'hover':
          // noinspection JSCheckFunctionSignatures
          subscribeTo('pointerenter', self.onHoverEnter, ...eventArgs)
          // noinspection JSCheckFunctionSignatures
          subscribeTo('pointerleave', self.onHoverLeave, ...eventArgs)
          return () => {
            // noinspection JSCheckFunctionSignatures
            unsubscribeFrom('pointerenter', self.onHoverEnter, ...eventArgs)
            // noinspection JSCheckFunctionSignatures
            unsubscribeFrom('pointerleave', self.onHoverLeave, ...eventArgs)
          }
      }
    })
    return () => events.forEach(unsubscribe => unsubscribe())
  }, [on])
  useEffect(() => {
    self.mounted = true
    const {onMount, open} = self.props
    if (onMount) onMount(self)
    if (open) self.open(new Event('mount')) // Show Tooltip on mount
    return () => {self.willUnmount = true}
  }, [])
  useIsomorphicLayoutEffect(() => {
    if (!prerender || !self.parent || !self.node) return
    self.setState({prerender: false, open: true, ...positionFrom(self.node, self.parent, self.props)})
  }, [prerender])

  // Render Props ----------------------------------------------------------------------------------
  const shouldRender = self.mounted && (prerender || state.open)
  if (state.style) style = style ? {...style, ...state.style} : state.style
  const styleWrap = useMemo(() => ({
    ...(shouldRender && embedded) ? collapsed : hidden,
    '--tooltip-offset': offset + 'px',
  }), [shouldRender, embedded, offset])

  return (
    <span className='tooltip-wrap' style={styleWrap} ref={ref}>
      {shouldRender && (embedded
        ? <TooltipRender {...props} {...state} on={on} style={style} self={self} />
        : createPortal(
          <TooltipRender {...props} {...state} on={on} style={style} self={self} />,
          document.body,
        ))}
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
  on: ['focus', 'hover'],
  offset: 16,
  position: 'top',
  theme: 'dark',
  role: 'tooltip',
}

let ToolTip
export default ToolTip = React.memo(Tooltip)

function TooltipRender ({
  open, position, prerender, self, // props from state
  animation, on, theme, align = (position === 'left' || position === 'right') ? 'middle' : 'center',
  className, style, tooltipClass, row, col = !(row), fill, reverse, rtl,
  left, right, top, bottom, center, middle,
  children, ...props
}) {

  useEffect(() => {
    if (!self.node) return
    if (!on.find(e => e === 'hover')) return
    const eventArgs = [void 0, self.node]
    // noinspection JSCheckFunctionSignatures
    subscribeTo('pointerenter', self.enterTooltip, ...eventArgs)
    // noinspection JSCheckFunctionSignatures
    subscribeTo('pointerleave', self.leaveTooltip, ...eventArgs)
    return () => {
      // noinspection JSCheckFunctionSignatures
      unsubscribeFrom('pointerenter', self.enterTooltip, ...eventArgs)
      // noinspection JSCheckFunctionSignatures
      unsubscribeFrom('pointerleave', self.leaveTooltip, ...eventArgs)
    }
  }, [on])

  return (
    <div className={cn(tooltipClass, 'tooltip col position-fixed', `theme-${theme}`,
      !prerender && `t-pos-${position} t-align-${align}`,
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
 * @param {object} props
 *    align: string - desired initially
 *    position: string - desired initially
 *    offset: number - to account for Tooltip offset position and pointer (ex. triangle)
 * @returns {{position: string, style: object}} state - props for optimum placement
 */
function positionFrom (node, parentElement, {align, position, offset = 0}) {
  // The outer div can have 0 height if Tooltip children is an inline element.
  // Use .tooltip__content div to guarantee correct Tooltip dimensions.
  // offsetHeight/offsetWidth dimensions may be incorrect within scroll, make sure the outer div has
  // fixed bottom and right positions set to 0 during the prerender phase.
  const {offsetHeight, offsetWidth} = node.children[0] // tooltip content
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
      style = {}
      switch (align) {
        case 'start':
          style.top = Math.max(0, top)
          break
        case 'end':
          style.top = Math.min(innerHeight, bottom) - offsetHeight // prevent bottom clipping
          style.top = Math.max(0, style.top)
          break
        default: // align to the middle
          style.top = Math.max(0, top + height / 2 - offsetHeight / 2)
      }
      style.top = Math.min(innerHeight - offsetHeight, style.top) // prevent bottom clipping
      if (position === 'left') style.right = innerWidth - left
      if (position === 'right') style.left = right
      return {position, style}
    case 'bottom':
    case 'top':
    default:
      style = {}
      switch (align) {
        case 'start':
          style.left = Math.max(0, left)
          break
        case 'end':
          style.left = Math.min(innerWidth, right) - offsetWidth // prevent right clipping
          style.left = Math.max(0, style.left)
          break
        default: // align to the center
          style.left = Math.max(0, left + width / 2 - offsetWidth / 2)
      }
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
const collapsed = {display: 'block', width: 0, height: 0, padding: 0, border: 0, overflow: 'visible'}
