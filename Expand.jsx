import cn from 'classnames'
import React, { useContext, useId, useRef } from 'react'
import { useExpandCollapse } from './react/hooks.js'
import { resolveChildren } from './react/render.js'
import { type } from './types.js'
import { View, ViewRef } from './View.jsx'

const ExpandInstance = React.createContext({})
const ExpandState = React.createContext({})

/**
 * Expand/Collapse - Accessible Component.
 * Multiple Expand Components can be used to create an Accordion.
 * @example:
 *     import { Expand, ExpandPanel, ExpandTab } from '@webframer/ui'
 *
 *     // Using render props
 *     <Expand onChange={warn}>
 *       <ExpandTab>{({open}) => open ? 'Collapse' : 'Expand'}</ExpandTab>
 *       <ExpandPanel><Text>Expandable Panel</Text></ExpandPanel>
 *     </Expand>
 *
 *     // Always render ExpandPanel content
 *     <Expand forceRender id='optional_id'>
 *       <ExpandTab>Toggle Expand/Collapse</ExpandTab>
 *       <ExpandPanel>{() => <Text>Expandable Function</Text>}</ExpandPanel>
 *     </Expand>
 *
 *     // Without ExpandTab and controlled `open` state
 *     <Expand asPanel open={true}>
 *       This expanded content will be wrapped with <ExpandPanel> implicitly
 *     </Expand>
 *
 * Unlike Tabs, Expand does not have controlled/uncontrolled state - it has a hybrid state.
 * If `open` prop passed, it will be used as initial state.
 * When `open` prop changes, it will update accordingly.
 */
export function Expand ({
  id = useId(), index, open: o, onChange, duration, forceRender, className, asPanel, ...props
}) {
  const {current: self} = useRef({})
  const [{open, animating}, toggleOpen, ref] = useExpandCollapse(o, {duration})

  // Handle Expand change
  self.onChange = onChange
  if (!self.toggleOpen) self.toggleOpen = (event) => {
    const open = !self.state.open
    toggleOpen()
    if (self.onChange) self.onChange(open, self.state.id, index, event)
  }

  // Force state update on every render
  self.state = {id, index, duration, forceRender, open, animating, ref}
  self.renderProps = {...self, ...self.state}

  // Resolve children
  props.children = resolveChildren(props.children, self.renderProps)
  if (asPanel) props.children = <ExpandPanel>{props.children}</ExpandPanel>

  return (
    <ExpandInstance.Provider value={self}>
      <ExpandState.Provider value={self.state}>
        <View className={cn(className, 'expand')} {...props} />
      </ExpandState.Provider>
    </ExpandInstance.Provider>
  )
}

Expand.propTypes = {
  // Expand content (see example)
  children: type.NodeOrFunction.isRequired,
  // Expand/Collapse animation duration in milliseconds
  duration: type.Milliseconds,
  // Optional unique identifier, will be passed to `onChange`, default is React.useId() string
  id: type.String,
  // Optional index identifier, will be passed to `onChange` (used by Accordion)
  index: type.Number,
  // Callback(open: boolean, id: string, index?: number, event: Event) when `open` state changes
  onChange: type.Function,
  // Whether to expand ExpandPanel content
  open: type.Boolean,
  // Whether to always render ExpandPanel content (useful for SEO indexing)
  // @see https://www.semrush.com/blog/html-hide-element/
  forceRender: type.Boolean,
  // Whether to wrap given `children` prop with <ExpandPanel> component (for use without ExpandTab)
  asPanel: type.Boolean,
}

Expand.defaultProps = {
  role: 'tablist',
  // 'aria-multiselectable': 'true',
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

  return <View className={cn(className, 'expand__tab', {open})} {...props} />
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
  const {open, animating, id, ref, forceRender: f} = useContext(ExpandState)
  const hidden = !open && !animating

  // Animation with initial `open` state and forwardRef requires ref to always stay on,
  // else on subsequent open, it will not animate because the ref does not exist on initial render.
  if (hidden && !(forceRender = forceRender || f)) {
    props = {} // remove all props to collapse fully
    className = null // also remove CSS classes to prevent layout bugs + enable transition on open
    // then keep accessibility props below
  }

  // Accessibility
  props.id = `panel_${id}`
  props['aria-labelledby'] = `tab_${id}`
  if (forceRender && hidden) {
    props['aria-expanded'] = 'false'
    props.hidden = true // must be boolean because this is native attribute
  } else {
    props['aria-expanded'] = open ? 'true' : 'false'
    props.hidden = false
  }

  // Resolve children
  props.children = resolveChildren(props.children, self.renderProps)
  props.ref = ref

  // Do not use Scroll here so user can have a choice of explicitly passing `scroll` attribute
  return <ViewRef className={cn(className, 'expand__panel')} {...props} />
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
