import cn from 'classnames'
import React from 'react'
import { useInstance, usePreviousProp } from './react/hooks.js'
import { renderProp } from './react/render.js'
import { type } from './types.js'
import { View } from './View.jsx'

/**
 * Accordion of Expandable/Collapsible content sections
 * @see: Expand docs for documentation.
 * @example:
 *    import { Accordion, Expand, ExpandPanel, ExpandTab } from '@webframer/ui'
 *
 *    <Accordion>
 *
 *      <Expand>
 *        <ExpandTab>{...}</ExpandTab>
 *        <ExpandPanel>{...}</ExpandPanel>
 *      </Expand>
 *
 *      <Expand>
 *        <ExpandTab>{...}</ExpandTab>
 *        <ExpandPanel>{...}</ExpandPanel>
 *      </Expand>
 *
 *    </Accordion>
 *
 * Logic:
 *  - To keep separation of concerns, and to avoid Expand using incorrect Accordion context,
 *    Shallow clone direct children (i.e. Expand components) to pass Accordion props.
 */
export function Accordion ({
  duration, forceRender, multiple, onChange, open, className, ...props
}) {
  const [opened] = usePreviousProp(open)
  const [self, state] = useInstance({openAll: open, openById: {}})
  if (opened != null && open != null && opened !== open) state.openAll = open // update prop changes

  // Handle Accordion change
  self.multiple = multiple
  self.onChange = onChange
  if (!self.toggleOpen) self.toggleOpen = (open, id, index, event) => {
    const {openById} = self.state
    self.setState({openAll: false, openById: {...self.multiple && openById, [index]: open}})
    if (self.onChange) self.onChange(open, id, index, event)
  }

  // Resolve direct children with Accordion props
  const {openAll, openById} = state
  self.renderProps = {...self, duration, forceRender, multiple, onChange, open: openAll}
  props.children = renderProp(props.children, self.renderProps)
  props.children = React.Children.map(props.children, (child, index) => {
    // Checking isValidElement is the safe way and avoids a typescript error.
    if (React.isValidElement(child)) {
      const newProps = {index, open: openAll || !!openById[index], onChange: self.toggleOpen}
      if (duration != null) newProps.duration = duration
      if (forceRender != null) newProps.forceRender = forceRender
      return React.cloneElement(child, newProps)
    }
    return child
  })

  return <View className={cn(className, 'accordion')} {...props} />
}

Accordion.propTypes = {
  // Expandable content (see example)
  children: type.NodeOrFunction.isRequired,
  // Expand/Collapse animation duration in milliseconds
  duration: type.Millisecond,
  // Whether to allow opening multiple Expand components at once
  multiple: type.Boolean,
  // Callback(open: boolean, id: string, index?: number, event: Event) when `open` state changes
  onChange: type.Function,
  // Whether to expand all ExpandPanel content
  open: type.Boolean,
  // Whether to always render ExpandPanel content (useful for SEO indexing)
  // @see https://www.semrush.com/blog/html-hide-element/
  forceRender: type.Boolean,
}

export default React.memo(Accordion)
