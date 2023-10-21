import { isNumber } from '@webframer/js'
import cn from 'classnames'
import React, { useMemo } from 'react'
import { renderProp } from '../react/render.js'
import { Scroll } from './Scroll.js'
import { useSelectionOptionProps } from './SelectOption.js'
import { VirtualList } from './VirtualList.js'

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
    let {className, style, childBefore, childAfter} = optionsProps || {}
    if (open) {
      let width = style && style.width
      // Set max-height possible for the Options (CSS can override with !important if desired)
      if (self.node) {
        const {top, bottom} = self.node.getBoundingClientRect()
        style = {
          maxHeight: Math.max(16, (self.upward ? top : window.innerHeight - bottom) - 16) + 'px',
          ...style,
        }
      }
      // Set fixed style
      if (fixed) {
        style = {
          ...self.getOptStyle(self.optPos, upward ? 'top' : 'bottom'),
          ...style,
        }
        // When opening a fixed dropdown, compact input may transition in width and become bigger
        // => use the bigger width value to avoid collapsing dropdown options
        if (width == null && self.inputNode && self.styleInput && self.styleInput.width) {
          let {paddingLeft, paddingRight, borderLeftWidth, borderRightWidth} = getComputedStyle(self.inputNode)
          let {offsetWidth} = self.inputNode
          offsetWidth = self.node.offsetWidth - offsetWidth +
            parseFloat(paddingLeft) + parseFloat(paddingRight) +
            parseFloat(borderLeftWidth) + parseFloat(borderRightWidth)
          width = self.styleInput.width
          style.width = isNumber(width) ? (width + offsetWidth) : `calc(${width} + ${offsetWidth}px)`
          style.transition = '500ms'
        }
      }
    }
    return {
      ...optionsProps,
      ...childBefore != null && {childBefore () {return renderProp(childBefore, self)}},
      ...childAfter != null && {childAfter () {return renderProp(childAfter, self)}},
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

const SelectOptionsMemo = React.memo(SelectOptions)
SelectOptionsMemo.name = SelectOptions.name
SelectOptionsMemo.propTypes = SelectOptions.propTypes
SelectOptionsMemo.defaultProps = SelectOptions.defaultProps
export default SelectOptionsMemo

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
