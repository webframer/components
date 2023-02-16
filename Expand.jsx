import cn from 'classnames'
import React, { useContext, useId, useMemo, useRef } from 'react'
import { useExpandCollapse } from './react/hooks.js'
import { renderProp } from './react/render.js'
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
 *       <ExpandTab row className='middle padding padding-v-smaller middle'>
 *         {({open}) => (<>
 *             <Icon className={open ? 'caret--expand' : 'caret--collapse'} name='wf/triangle-right' />
 *             <Text className='padding-h-smaller'>{slot}</Text>
 *         </>)}
 *       </ExpandTab>
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
 *       This content will be wrapped with '<ExpandPanel>' implicitly
 *     </Expand>
 *
 * Unlike Tabs, Expand does not have controlled/uncontrolled state - it has a hybrid state.
 * If `open` prop passed, it will be used as initial state.
 * When `open` prop changes, it will update accordingly.
 */
export function Expand ({
  id = useId(), index, open: o, onChange, duration, forceRender, className, asPanel, ...props
}) {
  const self = useRef({}).current
  const [{open, animating}, toggleOpen, ref] = useExpandCollapse(o, {duration})

  // Handle Expand change
  if (!self.props) {
    self.toggleOpen = function (e) {
      const {onChange} = self.props
      if (onChange) onChange.call(this, e, !self.state.open, self.state.id, index)
      if (e.defaultPrevented) return
      toggleOpen()
    }
  }
  self.props = arguments[0]

  // Force update when state changes
  self.state = useMemo(() => ({id, index, duration, forceRender, open, animating, ref}),
    [id, index, duration, forceRender, open, animating, ref])

  // Resolve children
  Object.assign(self, self.state)
  props.children = renderProp(props.children, self)
  if (asPanel) props.children = <ExpandPanel>{props.children}</ExpandPanel>

  // Set CSS animation duration as local variable
  props.style = {...props.style, '--expand-duration': duration + 'ms'}

  return (
    <ExpandInstance.Provider value={self}>
      <ExpandState.Provider value={self.state}>
        <View className={cn(className, 'expand', {open, animating})} {...props} />
      </ExpandState.Provider>
    </ExpandInstance.Provider>
  )
}

Expand.propTypes = {
  // Expand content (see example)
  children: type.NodeOrFunction.isRequired,
  // Expand/Collapse animation duration in milliseconds
  duration: type.Millisecond,
  // Optional unique identifier, will be passed to `onChange`, default is React.useId() string
  id: type.String,
  // Optional index identifier, will be passed to `onChange` (used by Accordion)
  index: type.Number,
  // Callback(event: Event, open: boolean, id: string, index?: number) when `open` state changes
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
  duration: 400,
  role: 'tablist',
  // 'aria-multiselectable': 'true',
}

/**
 * Expand Tab Header -------------------------------------------------------------------------------
 */
export function ExpandTab ({className, onClick, ...props}) {
  const self = useRef({}).current
  const expand = useContext(ExpandInstance)
  const {open, id, animating} = useContext(ExpandState)

  // Event handlers
  if (!self.props) {
    self.onClick = function (e) {
      const {open, id, index} = self.expand.state
      const {onClick} = self.props
      if (onClick) onClick.call(this, e, !open, id, index)
      if (e.defaultPrevented) return
      self.expand.toggleOpen.apply(this, arguments)
    }
  }
  self.props = arguments[0]
  self.expand = expand

  // Accessibility
  props.id = `tab_${id}`
  props['aria-controls'] = `panel_${id}`
  props['aria-selected'] = open ? 'true' : 'false'

  // Only enable `onClick` when not animating
  if (!animating) props.onClick = self.onClick

  // Resolve children
  props.children = renderProp(props.children, expand)

  return <View className={cn(className, 'expand__tab', {open, animating})} {...props} />
}

ExpandTab.propTypes = {
  // Expand header (see example)
  children: type.NodeOrFunction.isRequired,
  // Callback(event: Event, open: boolean, id: string | number, index?: number) when `open` state changes
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
  const expand = useContext(ExpandInstance)
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
  props.children = renderProp(props.children, expand)
  props.ref = ref

  // Do not use Scroll here so user can have a choice of explicitly passing `scroll` attribute
  return <ViewRef className={cn(className, 'expand__panel', {open, animating})} {...props} />
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
