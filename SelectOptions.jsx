import cn from 'classnames'
import React, { useMemo } from 'react'
import { Scroll } from './Scroll.jsx'
import { useSelectionOptionProps } from './SelectOption.jsx'
import { VirtualList } from './VirtualList.jsx'

/**
 * Higher Order Component to render Select Options.
 * This component constructs methods and props for Options renderer to consume,
 * where Options renderer is a plugin that can be swapped with VirtualList renderer.
 * It encapsulates away internal logic of Select component by exposing ready-made props.
 */
export function SelectOptions ({
  // Extract Options Props here
  fixed, open, upward, optionsProps,
  forceRender, virtualOptionsMinimum,
  self, ...restProps // pass the rest for conditional rendering to optimize for performance
}) {
  // Options Props ---------------------------------------------------------------------------------
  fixed = fixed && !!self.optPos
  optionsProps = useMemo(() => {
    let {className, style} = optionsProps || {}
    if (open) {
      // Set max-height possible for the Options (CSS can override with !important if desired)
      if (self.node) {
        const {top, bottom} = self.node.getBoundingClientRect()
        style = {
          maxHeight: Math.max(16, (self.upward ? top : window.innerHeight - bottom) - 16) + 'px',
          ...style,
        }
      }
      // Set fixed style
      if (fixed) style = {
        ...self.getOptStyle(self.optPos, upward ? 'top' : 'bottom'),
        ...style,
      }
    }
    return {
      ...optionsProps,
      className: cn('select__options', className, {fixed, open, upward, reverse: upward}),
      style,
      reverse: upward,
      _ref: self.optionsRef,
      scrollRef: self.optionsScrollRef,
      role: 'listbox',
      'aria-expanded': open,
    }
  }, [fixed, open, upward, optionsProps])

  const ListBox = restProps.options.length >= virtualOptionsMinimum ? VirtualOptions : Options
  return <ListBox {...{optionsProps, forceRender, open, self, ...restProps}} />
}

export default React.memo(SelectOptions)

// Virtual List Options Renderer
// todo: improvement - fix keyboard up/down focus jumps in scroll after about 30 steps
function VirtualOptions ({optionsProps, ...restProps}) {
  const {options} = restProps
  const {addOption, noOptions, renderOption, shouldRender} = useSelectionOptionProps(restProps)
  const items = useMemo(() => shouldRender ? options : [], [options, shouldRender])
  return (
    <VirtualList
      items={items}
      renderItem={renderOption}
      childBefore={addOption}
      childAfter={noOptions}
      {...optionsProps}
    />
  )
}

// Default Options Renderer
function Options ({optionsProps, ...restProps}) {
  const {options} = restProps
  const {addOption, noOptions, renderOption, shouldRender} = useSelectionOptionProps(restProps)
  const children = useMemo(() => shouldRender ? options.map(renderOption) : null,
    [renderOption, options, shouldRender])
  return (
    <Scroll
      children={children}
      childBefore={addOption}
      childAfter={noOptions}
      {...optionsProps}
    />
  )
}

// Keep focus within options length
export function normalizeFocusIndex (focusIndex, options) {
  focusIndex = focusIndex % options.length
  if (focusIndex < 0) focusIndex = options.length + focusIndex
  return focusIndex
}
