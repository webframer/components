import { get, isCollection, isEmpty, toList } from '@webframer/js'
import cn from 'classnames'
import * as React from 'react'
import { useMemo } from 'react'
import { DropdownMenu } from '../components/DropdownMenu.js'
import Icon from '../components/Icon.js'
import Text from '../components/Text.js'
import { useInstance } from '../react.js'
import { type } from '../types.js'
import { Select } from './Select.js'
import { optionTooltipProps } from './SelectOption.js'

/**
 * Nested Dropdown Selection, where `options` is a deeply nested collection (object or array),
 * and `value` is the selected key path (by default) or value (if `select='value'`).
 *
 * Logic:
 *  - Value is the entire selected path
 *  - The first selection level uses multiple Select, then NestedDropdown for the rest
 *  - When nested option is clicked, set it as multiple value inside Select
 *  - Each selected sub-path can have its own nested dropdowns
 *  - on select option, close all dropdowns, because Tooltip does not close when clicking inside itself
 *  - on='hover' Tooltip works well because loosing hover state only closes the last dropdown.
 *    => This is the desired UX because typically multilevel dropdowns would close everything,
 *       forcing the user to do it all over again, which is bad user experience.
 *  - todo: component onChange, onBlur, onFocus, format, parse, normalize handlers
 *  - todo: component keyboard accessibility - arrow up/down to navigate Dropdown options, Escape to exit, Enter to select
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

    // Handle Select keyboard events (`onClick` disabled via `optionProps.onClick`)
    self.onChangeSelect = function (e, keys) {
      self.selectOption.call(this, e, [keys.pop()])
    }

    self.onMountSelect = (instance) => self.select = instance

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

const SelectNestedMemo = React.memo(SelectNested)
SelectNestedMemo.name = SelectNested.name
SelectNestedMemo.propTypes = SelectNested.propTypes
SelectNestedMemo.defaultProps = SelectNested.defaultProps
export default SelectNestedMemo

function NestedDropdown_ ({
  options, self, // required
  parentPath = [], // parent key path
  id, isSelected, // whether this is the first level key selected inside Select component
  open, // whether nested DropdownMenu should open initially
  className, ...props
}) {
  // Render props ----------------------------------------------------------------------------------
  const {nestedIcon, nestedProps} = self.props
  const items = itemsFrom(options, self, parentPath)
  if (!items.length) return null

  // Reduce padding for selected keys inside Select component
  const selectedClass = {[selectedOptionClass]: isSelected}
  const selectedClassNested = {...selectedClass, 'padding-end-smallest': isSelected}

  return (<>
    {
      items.map(({key, value, text}) => {
        const keyPath = parentPath.concat([key])
        const isNested = isCollection(value) && !isEmpty(itemsFrom(value, self, keyPath))
        const onClick = isSelected ? undefined : ((e) => self.selectOption(e, keyPath))
        if (isNested) return (
          <DropdownMenu row className={cn('select-nested__option', className, optionClassNested, selectedClassNested)}
                        key={key} open={open} onClick={onClick} menu={(<>
            <Text className='margin-end-smaller'>{text}</Text>
            <Icon className='caret--collapsed' name={nestedIcon} />
          </>)} {...{
            ...props,
            tooltipProps: selectNestedTooltipProps,
            // Selected key inside Select component ony has a single key
            onMount: id ? ((instance) => self.selectedDropdownMenu[id] = instance) : void 0,
          }}>
            {() => <NestedDropdown options={value} self={self} {...nestedProps} parentPath={keyPath} />}
          </DropdownMenu>
        )
        return (
          <Text className={cn('select-nested__option', className, optionClass, selectedClass)}
                {...props} key={key} onClick={onClick} children={text}
          />
        )
      })
    }
  </>)
}

const NestedDropdown = React.memo(NestedDropdown_)

const list = []

// These props can be mutated during the implementation
export const selectNestedTooltipProps = {
  ...optionTooltipProps,
  embedded: false,
  className: 'max-width-320 p-0 after:hidden divide-h--wrap scrollable',
  position: 'right',
  on: ['click', 'focus', 'hover'],
  theme: 'glass',
}

// todo: component style - move custom styling to CSS, or provide default
const optionClass = 'divide-v--wrap padding-v-smaller padding-h'
const optionClassNested = 'justify middle ' + optionClass
const selectedOptionClass = 'padding-h-small !no-border'

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
