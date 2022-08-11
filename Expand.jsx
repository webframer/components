import { isFunction } from '@webframer/js'
import cn from 'classnames'
import React, { useContext, useId } from 'react'
import { Button } from './Button.jsx'
import { useInstance, usePreviousProp } from './react/hooks.js'
import { resolveChildren } from './react/render.js'
import { type } from './types.js'
import { View } from './View.jsx'

const ExpandInstance = React.createContext({})
const ExpandState = React.createContext({})

/**
 * Expand/Collapse - Pure Component.
 * Unlike Tabs, Expand does not have controlled/uncontrolled state - it has a hybrid state.
 * If `open` prop passed, it will be used as initial state. When `open` prop changes, it will update.
 */
export function Expand ({
  id = useId(), open, onChange, duration, forceRender, children, className, ...props
}) {
  const opened = usePreviousProp(open)
  const [self, state] = useInstance({id, open})
  if (opened !== open) state.open = !!open // update state when prop changes

  // Handle Expand change
  self.onChange = onChange
  if (!self.toggleOpen) self.toggleOpen = (event) => {
    const open = !self.state.open
    self.setState({open})
    if (self.onChange) self.onChange(open, self.state.id, event)
  }

  // Force state update on every render
  self.expandState = {duration, forceRender, ...state}
  self.renderProps = {...self, ...self.expandState}

  return (
    <ExpandInstance.Provider value={self}>
      <ExpandState.Provider value={self.expandState}>
        <View className={cn(className, 'expand__wrap')} {...props}>
          {isFunction(children) ? children(self.renderProps) : children}
        </View>
      </ExpandState.Provider>
    </ExpandInstance.Provider>
  )
}

Expand.propTypes = {
  // Expand content (see example)
  children: type.NodeOrFunction.isRequired,
  // Expand/Collapse animation duration in milliseconds
  duration: type.Milliseconds,
  // Optional identifier or index, will be passed to `onChange`, default is React.useId() string
  id: type.OneOf(type.String, type.Number),
  // Callback(open: boolean, id: string | number, event: Event) when `open` state changes
  onChange: type.Function,
  // Whether to expand ExpandPanel content initially
  open: type.Boolean,
  // Whether to always render ExpandPanel content (useful for SEO indexing)
  // @see https://www.semrush.com/blog/html-hide-element/
  forceRender: type.Boolean,
}

Expand.defaultProps = {
  role: 'tablist',
}

/**
 * Expand Tab Header -------------------------------------------------------------------------------
 */
export function ExpandTab ({className, onClick, ...props}) {
  const self = useContext(ExpandInstance)
  const {open, id, animating} = useContext(ExpandState)

  // Accessibility
  props.id = `tab_${id}`
  props['aria-controls'] = `panel_${id}`
  props['aria-selected'] = open ? 'true' : 'false'

  // Expand Props
  if (!animating) props.onClick = !onClick ? self.toggleOpen : (e) => {
    self.toggleOpen(e)
    onClick(e, id, self.state.open)
  }

  // Resolve children
  props.children = resolveChildren(props.children, self.renderProps)

  return <Button className={cn(className, 'expand__label', {open})} {...props} />
}

ExpandTab.propTypes = {
  // Expand header (see example)
  children: type.NodeOrFunction.isRequired,
  // Callback(event: Event, id: string | number, open: boolean) when `open` state changes
  onClick: type.Function,
}

ExpandTab.defaultProps = {
  role: 'tab',
  _nodrag: '',
}

/**
 * Expand Panel Content ----------------------------------------------------------------------------
 */
export function ExpandPanel ({className, forceRender, ...props}) {
  const self = useContext(ExpandInstance)
  const {open, id, forceRender: f} = useContext(ExpandState)
  if (!open && !(forceRender = forceRender || f)) return null

  // Accessibility
  props.id = `panel_${id}`
  props['aria-labelledby'] = `tab_${id}`
  if (forceRender && !open) {
    props['aria-expanded'] = 'false'
    props.hidden = true // must be boolean because this is native attribute
  } else {
    props['aria-expanded'] = 'true'
    props.hidden = false
  }

  // Resolve children
  props.children = resolveChildren(props.children, self.renderProps)

  // Do not use Scroll here so user can have a choice of explicitly passing `scroll` attribute
  return <View className={cn(className, 'expand__panel')} {...props} />
}

ExpandPanel.propTypes = {
  // Expand content (see example)
  children: type.NodeOrFunction.isRequired,
  // Whether to always render ExpandPanel content (useful for SEO indexing)
  // @see https://www.semrush.com/blog/html-hide-element/
  forceRender: type.Boolean,
}

ExpandPanel.defaultProps = {
  role: 'tabpanel',
  _nodrag: '',
}

export default React.memo(Expand)
