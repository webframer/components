// noinspection JSValidateTypes,JSCheckFunctionSignatures
import {
  _,
  debounce,
  isObject,
  KEY,
  l,
  localiseTranslation,
  subscribeTo,
  TIME_DURATION_INSTANT,
  unsubscribeFrom,
} from '@webframer/js'
import { isPureKeyPress } from '@webframer/js/keyboard.js'
import cn from 'classnames'
import Fuse from 'fuse.js'
import React, { useEffect, useMemo } from 'react'
import { assignRef, useExpandCollapse, useInstance } from './react.js'
import { Row } from './Row.jsx'
import { Scroll } from './Scroll.jsx'
import Text from './Text.jsx'
import { type } from './types.js'
import { moveFocus } from './utils/element.js'

/**
 * Dropdown List of Searchable Select Options and Nested Category Hierarchy
 * Use cases:
 *    1. Select (with options like `<select/>` element)
 *    2. Multiple select
 *    3. Search Select (+ multiple)
 *    4. Group options by category
 *    5. Overlay options when inside overflow-hidden parent
 *    6. Keyboard friendly
 *    7. Copy/Paste selected options
 *    8. Nested option category (options grouped into categories)
 *    9. Text literal with variables suggestion (prefixed with `$`).
 * Notes:
 *    - `compact` true sets input to dynamic character width, and increases when options open
 *    - Options use position `absolute` initially, then `fixed` if `defaultOpen` = false,
 *      to remain visible inside overflow hidden Scroll
 *      => `.select__options` class must have `max-height` set to explicit unit, such as `px`
 */
export function Select ({
  options, value, query, search, defaultOpen, compact, fuzzyOpt,
  forceRender, noFixedOptions, upward, addOption,
  childBefore, childAfter, className,
  multiple, onChange, onSearch, onSelect, onAddOption,
  _ref, refInput, ...props
}) {
  const [self, state] = useInstance({options, query})
  const [{open, animating}, toggleOpen, ref] = useExpandCollapse(defaultOpen)
  useEffect(() => (self.didMount = true) && (() => {self.willUnmount = true}), [])
  Object.assign(self, {multiple, options, onChange, onSearch, onSelect, onAddOption}, props)
  self.open = open

  // State should store pure value as is, because `value` can be an array for multiple selection
  // Then let the render logic compute what to display based on given value.
  // For single selection, when no custom option render exists, input shows text value.
  if (value != null) state.value = value

  // Node Handlers ---------------------------------------------------------------------------------
  if (!self.ref) self.ref = function (node) {
    self.node = node
    return assignRef.call(this, _ref, ...arguments)
  }
  if (!self.ref1) self.ref1 = function (node) {
    self.inputNode = node
    return assignRef.call(this, refInput, ...arguments)
  }
  if (!self.ref2) self.ref2 = function (node) {
    self.optNode = node
    return assignRef.call(this, ref, ...arguments)
  }
  if (!self.scrollProps) self.scrollProps = {ref: (node) => self.scrollNode = node}
  if (!self.getOptionsPosition) self.getOptionsPosition = getOptionsPosition
  if (!self.getOptStyle) self.getOptStyle = getFixedOptionsStyle

  // Event Handlers --------------------------------------------------------------------------------
  if (!self.focus) self.focus = function (e) {
    self.hasFocus = true
    self.openOptions()
    if (self.onFocus) return self.onFocus.apply(this, arguments)
  }
  if (!self.focusOption) self.focusOption = function () {
    self.hasFocus = true
    if (self.onSelect) return self.onSelect.apply(this, arguments)
  }
  if (!self.blur) self.blur = function () {
    self.hasFocus = false
    if (self.open) setTimeout(self.closeOptions, 0)
    if (self.onBlur) return self.onBlur.apply(this, arguments)
  }
  if (!self.blurOption) self.blurOption = function () {
    self.hasFocus = false
    if (self.open) setTimeout(self.closeOptions, 0)
  }
  if (!self.change) self.change = function (item) {
    self.hasFocus = self.multiple
    const {text = item, value = text} = isObject(item) ? item : {}
    self.setState({value, query: String(text)})
    if (self.open) setTimeout(self.closeOptions, 0)
    if (self.onChange) return self.onChange.apply(this, arguments) // pass selected item by reference
  }
  if (!self.closeOptions) self.closeOptions = function () {
    if (self.willUnmount || self.hasFocus || !self.open) return
    const {value, query} = self.state // reset search query to match selected value
    if (value != null && value !== query) self.state.query = String(getValueText(value, self.options))
    toggleOpen.apply(this, arguments)
    self.unsubscribeKeyboard()
  }
  if (!self.openOptions) self.openOptions = function () {
    if (self.open) return
    toggleOpen.apply(this, arguments)
    self.subscribeToKeyboard()
  }

  // Fuzzy Search ----------------------------------------------------------------------------------
  if (search && !self.fuse) self.fuse = new Fuse([], fuzzyOpt)
  useMemo(() => search && (self.fuse.setCollection(toFuseList(options))), [search, options])
  if (search && !self.getOptions) self.getOptions = function (query) {
    const {options} = self
    return self.fuse.search(query).map(v => options[v.refIndex])
  }
  if (search && !self.search) self.search = function (e) {
    const query = e.target.value
    self.setState({query})
    self.updateOptions(query)
    if (self.onSearch) return self.onSearch.call(this, query, ...arguments)
  }
  if (search && !self.updateOptions) self.updateOptions = debounce((query) => {
    if (self.willUnmount) return
    self.setState({options: query ? self.getOptions(query) : options, query})
  }, TIME_DURATION_INSTANT)
  if (!self.didMount && search && query) self.state.options = self.getOptions(query)

  // Accessibility ---------------------------------------------------------------------------------
  if (!self.subscribeToKeyboard) self.subscribeToKeyboard = function () {
    if (self.subscribed) return
    self.subscribed = true
    subscribeTo('keydown', self.press)
  }
  if (!self.unsubscribeKeyboard) self.unsubscribeKeyboard = function () {
    if (!self.subscribed) return
    self.subscribed = false
    unsubscribeFrom('keydown', self.press)
  }
  if (!self.press) self.press = function (e) {
    if (!isPureKeyPress(e) || !self.scrollNode || !self.inputNode) return
    // Check that keypress originates from this Select instance (input or options node)
    if (e.target !== self.inputNode && e.target.parentElement !== self.scrollNode) return
    switch (e.keyCode) {
      case KEY.ArrowDown:
        e.preventDefault()
        return self.pressDown()
      case KEY.ArrowUp:
        e.preventDefault()
        return self.pressUp()
    }
  }
  if (!self.pressDown) self.pressDown = function () {
    if (!self.open || !self.scrollNode) return
    moveFocus(self.scrollNode.children, self.upward ? -1 : 1)
  }
  if (!self.pressUp) self.pressUp = function () {
    if (!self.open || !self.scrollNode) return
    moveFocus(self.scrollNode.children, self.upward ? 1 : -1)
  }
  if (open) self.subscribeToKeyboard()
  useEffect(() => self.unsubscribeKeyboard, [])
  const optPos = self.getOptionsPosition()
  const listBox = {
    role: 'listbox', 'aria-expanded': open,
    style: (defaultOpen || noFixedOptions) ? null : self.getOptStyle(optPos, upward ? 'top' : 'bottom'),
    scrollProps: self.scrollProps,
  }
  self.upward = upward = upward && (optPos && (optPos.canBeUpward || optPos.optimalPosition.bottom > 0))

  // Input value should be:
  //    - query: for search selection
  //    - value: for single selection
  // Multiple selection does not use input to display value, only single selection
  // => sync query with value onChange for single selection, then use `query` for input

  return (
    <Row className={cn(className, `select wrap ${compact ? 'width-fit' : 'full-width'}`)}
         _ref={self.ref}>
      {childBefore}
      <input className={cn({'full-width': !compact})} readOnly={!search} {...props} ref={self.ref1}
             value={state.query} onChange={self.search} onFocus={self.focus} onBlur={self.blur} />
      {childAfter}
      <Scroll className={cn('select__options', {open, upward})}
              noOffset reverse={upward} _ref={self.ref2} {...listBox}>
        {(forceRender || open || animating) &&
          <Options items={state.options} query={state.query}
                   onFocus={self.focusOption} onBlur={self.blurOption} onChange={self.change} />}
      </Scroll>
    </Row>
  )
}

Select.defaultProps = {
  // Will be used if input value = ''
  get placeholder () {return _.SELECT},
  // Fuzzy search options // https://fusejs.io/demo.html
  // The default works even if the options is a list of Strings (does not work with number)
  fuzzyOpt: {keys: ['text']},
  // Default to empty string to prevent React controlled input error
  query: '',
}

Select.propTypes = {
  // Selectable values
  options: type.ListOf(type.OneOf(
    type.String,
    type.Number,
    type.Boolean,
    type.Of({
      // Searchable option string, will be used as value, if `value` not defined
      text: type.String.isRequired,
      // Internal option value to store as selected value and to call handlers with
      value: type.Any,
      // Required by React, if String(value) does not result in unique `key` string
      key: type.Any,
    }),
  )),
  // Handler(value: string | number | object, event) when selected value changes
  onChange: type.Function,
  // Handler(query, event) when search input value changes
  onSearch: type.Function,
  // Handler(value: string | number | object, event) when an option gets focus
  onSelect: type.Function,
  // Handler(value, name) when a new option is added
  onAddOption: type.Function,
  // Whether to allow users to add a new option (in combination with search)
  addOption: type.Boolean,
  // Whether to take minimal width required to render selection(s)
  compact: type.Boolean,
  // Whether to open options initially
  defaultOpen: type.Boolean,
  // Whether to always render options, even when closed
  forceRender: type.Boolean,
  // Whether to allow multiple selections and store values as array
  multiple: type.Boolean,
  // Whether to disable fixed position options. By default, options change to fixed position on open
  noFixedOptions: type.Boolean,
  // Default search query to use
  query: type.String,
  // Whether to enable search by options, pass Handler(query, options) => value for custom search
  search: type.OneOf(type.Boolean, type.Function),
  // Whether options menu should try to open from the top, default is from the bottom
  upward: type.Boolean,
  // Selected value(s) - if passed, becomes a controlled component
  value: type.OneOf(type.String, type.Number, type.Boolean, type.List),
  // Message to display when there are no results.
  noResultsMessage: type.String,
  // Other native `<input>` props
}

export default React.memo(Select)

function SelectOptions ({items, query, onFocus, onBlur, onChange, ...props}) {
  return (<>
    {items.map((item) => {
      let t, k
      if (isObject(item)) {
        const {text, value = text, key = String(value)} = item
        t = text
        k = key
      } else {
        t = k = String(item)
      }

      // Bolden the matched query
      if (query) {
        let i, q = query.toLowerCase(), text = t.toLowerCase()
        // to keep the logic simple, for now only use exact match once, case-insensitive
        if (q === text) t = <u><b>{t}</b></u>
        else if ((i = text.indexOf(q)) > -1)
          t = <>{t.substring(0, i)}<u><b>{t.substring(i, i + q.length)}</b></u>{t.substring(i + q.length)}</>
      }
      return <Row key={k} className='select__option'
                  onClick={function () {onChange.call(this, item, ...arguments)}}
                  onFocus={function () {onFocus.call(this, item, ...arguments)}}
                  onBlur={function () {onBlur.call(this, item, ...arguments)}}
                  children={<Text>{t}</Text>}
                  {...props} />
    })}
  </>)
}

const Options = React.memo(SelectOptions)

function toFuseList (options) {
  if (!options.length) return options
  if (!isObject(options[0])) return options.map(v => String(v))
  return options
}

function getOptionsPosition (self = this) {
  if (!self.node || !self.optNode || !self.scrollNode) return
  const {top: topAvail, bottom: top, width, height} = self.node.getBoundingClientRect()
  const {height: actualHeight} = self.scrollNode.getBoundingClientRect()
  let maxHeight = +getComputedStyle(self.optNode).getPropertyValue('max-height').replace('px', '')
  if (!maxHeight) throw Error('Select options must have explicit max-height!')
  maxHeight = Math.min(actualHeight, maxHeight)
  const bottom = window.innerHeight - topAvail
  const bottomAvail = window.innerHeight - topAvail - height
  return {
    canBeUpward: topAvail - maxHeight > 0,
    canBeDownward: bottomAvail > maxHeight,
    optimalPosition: bottomAvail > topAvail ? {top} : {bottom}, // where there is more space
    bottom, // upward placement bottom position
    top, // downward placement top position
    width,
  }
}

function getFixedOptionsStyle (optionsPosition, desiredPosition) {
  if (!optionsPosition) return
  const {canBeUpward, canBeDownward, optimalPosition, bottom, top, width} = optionsPosition

  function getStyle () {
    switch (desiredPosition) {
      case 'top':
        if (canBeUpward) return {bottom} // place upwards
        if (canBeDownward) return {top} // place downwards
        return optimalPosition
      case 'bottom':
      default: // try to put options downwards, if there is enough space in viewport
        if (canBeDownward) return {top} // place downwards
        if (canBeUpward) return {bottom} // place upwards
        return optimalPosition
    }
  }

  return {position: 'fixed', width, top: 'auto', bottom: 'auto', ...getStyle()}
}

function getValueText (val, options) {
  if (!options.length) return val
  if (isObject(options[0])) return (options.find(({text, value = text}) => value === val) || {}).text || val
  return val
}

localiseTranslation({
  SELECT: {
    [l.ENGLISH]: 'Select',
  },
})
