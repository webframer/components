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
    if (fixed && open) style = {
      ...self.getOptStyle(self.optPos, upward ? 'top' : 'bottom'),
      ...style,
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
function VirtualOptions ({optionsProps, forceRender, open, ...restProps}) {
  const {options} = restProps
  const items = useMemo(() => (forceRender || open) ? options : [], [options, forceRender, open])
  const {addOption, noOptions, renderOption} = useSelectionOptionProps(restProps)
  return (
    <VirtualList
      items={items}
      renderItem={renderOption}
      childAfter={<>
        {addOption}
        {noOptions}
      </>}
      {...optionsProps}
    />
  )
}

// Default Options Renderer
function Options ({optionsProps, forceRender, open, ...restProps}) {
  return (
    <Scroll {...optionsProps}>
      {(forceRender || open) && <Option {...restProps} />}
    </Scroll>
  )
}

// Default Option Renderer
function Option (props) {
  const {options} = props
  const {addOption, noOptions, renderOption} = useSelectionOptionProps(props)
  return (<>
    {options.map(renderOption)}
    {addOption}
    {noOptions}
  </>)
}

// Keep focus within options length
export function normalizeFocusIndex (focusIndex, options) {
  focusIndex = focusIndex % options.length
  if (focusIndex < 0) focusIndex = options.length + focusIndex
  return focusIndex
}
