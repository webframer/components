import { get, isCollection, isEmpty, subscribeTo, toList, unsubscribeFrom } from '@webframer/js'
import cn from 'classnames'
import React, { useEffect, useMemo } from 'react'
import { DropdownMenu } from './DropdownMenu.jsx'
import Icon from './Icon.jsx'
import { useInstance } from './react.js'
import { Row } from './Row.jsx'
import { Select } from './Select.jsx'
import { optionTooltipProps } from './SelectOption.jsx'
import Text from './Text.jsx'
import { type } from './types.js'
import { View } from './View.jsx'

/**
 * Nested Dropdown Selection, where `options` is a deeply nested collection (object or array),
 * and `value` is the selected key path (by default) or value (if `select='value'`).
 *
 * Logic:
 *  - Value is the entire selected path
 *  - The first selection level uses multiple Select, then NestedDropdown for the rest
 *  - When nested option is click, set it as multiple value inside Select
 *  - Each selected sub-path can have its own nested dropdowns
 *  - onClick outside, close all dropdowns, because Tooltip only closes on hover;
 *  - on='hover' Tooltip works well because loosing hover state only closes the last dropdown.
 *    => This is the desired UX because typically multilevel dropdowns would close everything,
 *       forcing the user to do it all over again, which is bad user experience.
 *  - todo: onChange, onBlur, onFocus, format, parse, normalize handlers
 *  - todo: keyboard accessibility - arrow up/down to navigate Dropdown options, Escape to exit, Enter to select
 *  - todo: selected keys to disable onClick and enable tooltip onClick
 */
export function SelectNested ({
  className, options, filterValue, formatKey, nestedIcon, nestedProps,
  defaultValue,
  ...props
}) {
  const [self, {value = list}] = useInstance()

  // Event Handlers --------------------------------------------------------------------------------
  if (!self.props) {
    // Internal cache of selected keys' DropdownMenu instances by their `id` to close dropdowns
    self.selectedDropdownMenu = {}

    /**
     * Internal onChange handler for SelectNested value
     * @param {Event} e
     * @param {string|string[]} keyPath - array of all selected keys/indices
     */
    self.changeValue = (e, keyPath) => {
      keyPath = toList(keyPath)
      self.setState({value: keyPath})

      // Garbage clean DropdownMenu instances
      const {selectedDropdownMenu} = self
      const ids = []
      keyPath = [...keyPath]
      while (keyPath.length) {
        ids.push(String(keyPath))
        keyPath.pop()
      }
      for (const id in selectedDropdownMenu) {
        if (!ids.includes(id)) delete selectedDropdownMenu[id]
      }
    }

    // Click on nested Dropdown panel or Select.onChange fired via keyboard
    self.selectOption = function (e, keyPath) {
      self.changeValue.apply(this, arguments)
      self.closeDropdowns.call(this, e)
      if (self.select?.open) self.select.toggleOpen.call(this, e) // close Select
    }

    // Handler Select keyboard events (`onClick` disabled via `optionProps.onClick`)
    self.onChangeSelect = function (e, keys) {
      self.selectOption.call(this, e, [keys.pop()])
    }

    self.onMountSelect = (instance) => self.select = instance

    self.onClickAnywhere = function (e) {
      if (e.defaultPrevented) return
      if (!self.select?.node) return
      let target = e.target
      if (target) {
        while (target.parentElement) {
          if (target === self.select.node) return // ignore clicks from nested dropdowns
          target = target._parentElement || target.parentElement
        }
        target = null
      }
      self.closeDropdowns.apply(this, arguments)
    }

    // Close all dropdowns
    self.closeDropdowns = function () {
      Object.values(self.selectedDropdownMenu)
        .forEach(instance => instance.tooltip?.close.apply(this, arguments))
    }

    // Selected keys inside Select component
    self.renderSelectedKey = function (key, index, arr) {
      const keyPath = index ? self.state.value.slice(0, index + 1) : [key]
      const value = get(self.props.options, keyPath)
      const id = String(keyPath) // `key` can have duplicates (ex. key `form` in keyPath `form.name.form`)
      const open = index === arr.length - 1 // only open the last key by default after selection
      keyPath.pop() // pop for nested dropdowns
      return <NestedDropdown options={{[key]: value}}
                             {...{key: id, self, parentPath: keyPath, id, isSelected: true, open}} />
    }
  }
  self.props = arguments[0]
  useEffect(() => {
    subscribeTo('click', self.onClickAnywhere)
    return () => unsubscribeFrom('click', self.onClickAnywhere)
  }, [])

  // Render props ------------------------------------------------------------------
  const selectOptions = useMemo(() => itemsFrom(options, self).map(({key, value}) => ({
    key,
    value: key,
    children: () => <NestedDropdown options={{[key]: value}} self={self} {...nestedProps} />,
  })), [options, nestedProps])

  return (
    <Select
      className={cn(className, 'select-nested')}
      {...props}
      multiple controlledValue
      value={value}
      options={selectOptions}
      onChange={self.onChangeSelect}
      onMount={self.onMountSelect}
      renderSelected={self.renderSelectedKey}
    />
  )
}

SelectNested.defaultProps = {
  optionProps: {
    className: 'no-padding !no-border',
    /**
     * Override SelectOption `onClick` for keyboard accessibility.
     * This will prevent Select from firing `onChange` event on click,
     * because `selectOption()` is not fired.
     * However, if the user presses Enter, `selectOption()` is fired internally without click,
     * and will call Select.onChange event.
     * So handle Select.onChange for accessibility, and leave this function empty
     * to prevent firing Select.onChange twice.
     */
    onClick () {},
  },
  // Chevron-right for LTR direction
  nestedIcon: 'caret',
  nestedProps: {
    className: 'fill-width',
  },
  // select: 'key', todo
}

SelectNested.propTypes = {
  // Icon indicator for nested collections
  nestedIcon: type.Icon,
  // Any object or array, or a deeply nested collection of `type.Option`
  options: type.OneOf([
    type.List,
    type.ListOf(type.Option),
    type.Object,
    type.ObjectOf(type.Option),
  ]).isRequired,
  // Function(key: string, keyPath: string[], self) => string - to format key path for display
  formatKey: type.Function,
  // Function(value: any, key: string, keyPath: string[], self) => boolean - true to render value, false to skip
  filterValue: type.Function,
  // Selected `value` type, where `key` is selected key path (ex. 'window.navigator')
  // select: type.Enum(['key', 'value']),
}

function NestedDropdown_ ({
  options, self, // required
  parentPath = [], // parent key path
  id, isSelected, // whether this is the first level key selected inside Select component
  open, // whether nested DropdownMenu should open initially
  ...props
}) {
  // Render props ----------------------------------------------------------------------------------
  const {nestedIcon, nestedProps} = self.props
  const items = itemsFrom(options, self, parentPath)
  if (!items.length) return null

  // Reduce padding for selected keys inside Select component
  const selectedClass = {[selectedPanelClass]: isSelected}
  const selectedClassNested = {...selectedClass, 'padding-end-smallest': isSelected}
  return (
    <View scroll={items.length > 1} scrollAlongDirectionOnly {...props}>
      {
        items.map(({key, value, text}) => {
          const keyPath = parentPath.concat([key])
          const isNested = isCollection(value) && !isEmpty(itemsFrom(value, self, keyPath))
          const onClick = (e) => self.selectOption(e, keyPath)
          if (isNested) return (
            <DropdownMenu key={key} open={open} menu={(
              <Row className={cn(rowClass, selectedClassNested)} onClick={onClick}>
                <Text className='margin-end-smaller'>{text}</Text>
                <Icon className='caret--collapsed' name={nestedIcon} />
              </Row>
            )} {...{
              tooltipProps: selectNestedTooltipProps,
              // Selected key inside Select component ony has a single key
              onMount: id ? ((instance) => self.selectedDropdownMenu[id] = instance) : void 0,
            }}>
              {() => <NestedDropdown options={value} self={self} {...nestedProps} parentPath={keyPath} />}
            </DropdownMenu>
          )
          return <Text key={key} className={cn(panelClass, selectedClass)} onClick={onClick}>{text}</Text>
        })
      }
    </View>
  )
}

const NestedDropdown = React.memo(NestedDropdown_)

const list = []

// These props can be mutated during the implementation
export const selectNestedTooltipProps = {
  ...optionTooltipProps,
  className: 'max-width-320 p-0 after:hidden divide-h--wrap',
  embedded: false,
  position: 'right', on: 'hover',
}

const panelClass = 'divide-v--wrap padding-v-smaller padding-h hover:bg-shadow-lightest hover:text-dark'
const rowClass = 'justify middle ' + panelClass
const selectedPanelClass = 'padding-h-small !no-border'

// Helpers -----------------------------------------------------------------------------------------

/**
 * Compute options to render
 * @param {any} options - possible collection to process
 * @param {object} self
 * @param {string[]} [parentPath] - parent key path prefix
 * @returns {{key: string, value: any, text: string}[]}
 */
function itemsFrom (options, self, parentPath = []) {
  const {formatKey, filterValue} = self.props
  let value, items = [], keyPath
  for (const key in options) {
    value = options[key]
    keyPath = parentPath.concat([key])
    if (filterValue && !filterValue.call(self, value, key, keyPath, self)) continue
    items.push({key, value, text: formatKey ? formatKey.call(self, key, keyPath, self) : key})
  }
  return items
}
