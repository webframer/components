import { debounce, isObject, subscribeTo, toUniqueListFast, trimSpaces, unsubscribeFrom } from '@webframer/utils'
import cn from 'classnames'
import React, { useEffect, useRef } from 'react'
import { useInstance } from './react/hooks.js'
import { type } from './types.js'

// todo: ensure tooltip is within viewport
export function Tooltip ({
  position = 'top', on = 'hover', open = false, delay = 700, animation = 'fade-in', theme = 'dark',
  className, row, col = !row, fill, reverse, rtl,
  left, right, top, bottom, center, middle,
  ...props
}) {
  const ref = useRef(null)
  const [self, state] = useInstance({open})
  open = state.open

  if (!self.openDelayed) self.openDelayed = debounce(() => self.canceled || self.setState({open: true}), delay)

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
      self.setState({open: !self.state.open})
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

  // For now, for simplicity, only register events on component mount,
  // because the use cases for changing tooltip behavior after mounting is rare.
  useEffect(() => {
    if (!ref.current) return
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

  // Convert positions: top/left/right/bottom to 'from-top', 'from-left', etc.
  // todo: component improvement - add positions similar to Ant Design
  //  https://open-ui.org/components/tooltip.research (LT, TL, etc.)
  // Place in the center/middle by default
  const align = (position.indexOf('left') >= 0 || position.indexOf('right') >= 0) ? 'middle' : 'center'
  position = trimSpaces(position).split(' ').filter(pos => positionEnum.indexOf(pos) >= 0)
    .map(pos => `from-${pos}`)

  return ( // Wrapper div is required for CSS so that inner div can be styled with :before, :after
    <span className={cn('_tooltip row position-fill', position.join(' '), `theme-${theme}`, align)} ref={ref}>
      {/* This extra middle div fixes {width/height: fit-content} problem for Safari */}
      <span className='col position-absolute'>
        {/* Inner behaves like View.jsx - tooltip pointer can be added to this */}
        <span className={cn(className, {
          col, row, fill, reverse, rtl,
          left, right, top, bottom, center, middle,
          pointer: props.onClick,
          [animation]: open,
          hidden: !open,
        })} {...props} />
      </span>
    </span>
  )
}

Tooltip.propTypes = {
  // One of, or any combination of: 'hover', 'click' - separated by space
  on: type.String,
  // One of, or any combination of: 'top', 'left', 'right', 'bottom' - separated by space
  position: type.String,
}

Tooltip.defaultProps = {
  position: 'top center',
}

let ToolTip
export default ToolTip = React.memo(Tooltip)

const positionEnum = ['top', 'right', 'bottom', 'left']

/**
 * Extend a Component with `tooltip` prop.
 * @example:
 *    const [tooltip] = useTooltip(props)
 *
 *    // Tooltip will open when hovering over `div` by default
 *    return <div>{children}{tooltip}</div>
 *
 * @param {object|{tooltip?: any}} - props of the Component with optional `tooltip` prop
 * @returns [tooltip: JSX.Element|null]
 */
export function useTooltip ({tooltip}) {
  if (tooltip == null) return [null]

  if (React.isValidElement(tooltip)) // noinspection JSValidateTypes
    return [<ToolTip>{tooltip}</ToolTip>]

  if (isObject(tooltip)) // noinspection JSValidateTypes
    return [<ToolTip {...tooltip} />]

  // Tooltip is a primitive value
  // noinspection JSValidateTypes
  return [<ToolTip>{String(tooltip)}</ToolTip>]
}
