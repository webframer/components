// noinspection JSValidateTypes,JSCheckFunctionSignatures
// noinspection JSCheckFunctionSignatures
import {
  _,
  debounce,
  hasListValue,
  isObject,
  isString,
  KEY,
  l,
  last,
  localiseTranslation,
  subscribeTo,
  TIME_DURATION_INSTANT,
  toUniqueListFast,
  trimSpaces,
  unsubscribeFrom,
} from '@webframer/js'
import { isPureKeyPress } from '@webframer/js/keyboard.js'
import cn from 'classnames'
import Fuse from 'fuse.js'
import React, { useEffect, useMemo } from 'react'
import Icon from './Icon.jsx'
import { assignRef, toReactProps, useExpandCollapse, useInstance } from './react.js'
import { renderProp } from './react/render.js'
import { Row } from './Row.jsx'
import { Scroll } from './Scroll.jsx'
import SelectOptions, { addOptionItem } from './SelectOptions.jsx'
import Text from './Text.jsx'
import { type } from './types.js'
import { resizeWidth, setFocus } from './utils/element.js'
import { onEventStopPropagation } from './utils/interactions.js'

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
 *    - There are use cases when Select is used to concatenate string value from array.
 *      The parse function will convert array into a single string,
 *      But Select will need to split the string back to array value for internal state,
 *      possibly including mapping to the actual values.
 *      Select.value should always point to the source of truth,
 *      which in this case is a concatenated string, not array.
 *      But that complicates its internal logic.
 *      => What we need instead, is a serializer that
 *         converts form.values to individual input type value for each UI component.
 *         This way backend can store a different value format from UI internal state.
 *      @see https://www.django-rest-framework.org/api-guide/serializers/
 *
 * @example:
 *    // Format backend data to frontend value
 *    serialize('row reverse')
 *    >>> ['row', 'reverse']
 *
 *    // Parse frontend value to backend data
 *    deserialize(['row', 'reverse'])
 *    >>> 'row reverse'
 */
export function Select (_props) {
  let {
    options, defaultValue, name, defaultOpen, fuzzyOpt, focusIndex,
    multiple, query, search, compact, forceRender, fixed, upward,
    onChange, onFocus, onBlur, onSearch, onSelect, onClickValue,
    icon, iconEnd, iconProps,
    addOption, addOptionMsg, noOptionsMsg,
    format, parse, // these are serializer and deserializer
    type, // not used
    childBefore, childAfter, className, style, row,
    _ref, inputRef, ...props
  } = _props
  props = toReactProps(props)
  let {value = defaultValue} = props
  const [self, state] = useInstance({options, query, value, focusIndex})
  let [{open, animating}, toggleOpen, ref] = useExpandCollapse(defaultOpen)
  self.open = open // for internal logic
  open = open || animating // for rendering and styling
  useEffect(() => (self.didMount = true) && (() => {self.willUnmount = true}), [])

  // Initialize once
  if (!self.props && value != null && format)
    state.value = format(value, name, void 0, self)

  // Controlled state
  else if (props.value != null)
    // State should store pure value as is, because `value` can be an array for multiple selection
    // Then let the render logic compute what to display based on given value.
    // For single selection, when no custom option render exists, input shows text value.
    state.value = format ? format(props.value, name, void 0, self) : props.value

  // Simulate class instance props
  self.props = _props

  // Node Handlers ---------------------------------------------------------------------------------
  if (!self.ref) self.ref = function (node) {
    self.node = node
    return assignRef.call(this, _ref, ...arguments)
  }
  if (!self.ref1) self.ref1 = function (node) {
    self.inputNode = node
    return assignRef.call(this, inputRef, ...arguments)
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
    self.openOptions.apply(this, arguments)
  }
  // if (!self.focusInput) self.focusInput = function () {
  //   if (!self.inputNode) return
  //   self.inputNode.focus() // setting focus on input will trigger input.onFocus handler
  // }
  if (!self.focusOption) self.focusOption = function (item, e) {
    const {onSelect, name} = self.props
    self.hasFocus = true
    if (onSelect) onSelect.call(this, item, name, e, self) // pass selected item by reference
  }
  if (!self.blur) self.blur = function (e) {
    self.hasFocus = false
    if (self.open) setTimeout(() => self.closeOptions.call(this, e), 0)
  }
  if (!self.blurOption) self.blurOption = function (e) {
    self.hasFocus = false
    if (self.open) setTimeout(() => self.closeOptions.call(this, e), 0)
  }
  if (!self.selectOption) self.selectOption = function (item, e) { // options clicked
    const {multiple, onChange, name, parse} = self.props
    self.hasFocus = multiple
    let {text = item, value = text} = isObject(item) ? item : {}
    if (multiple) value = toUniqueListFast((self.state.value || []).concat(value))
    if (onChange) onChange.call(this, parse ? parse(value, name, e, self) : value, name, e, self)
    if (e.defaultPrevented) return
    const options = getOptionsFiltered(self)
    self.setState({
      value, query: multiple ? '' : String(text), options,
      focusIndex: options.findIndex(i => i === item),
    })
    if (multiple && self.inputNode) self.inputNode.focus()
    if (self.open) setTimeout(() => self.closeOptions.call(this, e), 0)
  }
  if (multiple && !self.deleteValue) self.deleteValue = function (val, e) {
    const {onChange, name, parse} = self.props
    const value = self.state.value.filter(v => v !== val)
    if (onChange) onChange.call(this, parse ? parse(value, name, e, self) : value, name, e, self)
    if (e.defaultPrevented) return
    self.setState({value})
  }
  if (!self.closeOptions) self.closeOptions = function (e) {
    if (self.willUnmount || self.hasFocus || !self.open) return
    const {onBlur, name, parse} = self.props
    if (onBlur) {
      const {value} = self.state
      onBlur.call(this, parse ? parse(value, name, e, self) : value, name, e, self)
    }
    if (e.defaultPrevented) return
    // Input query on close use-cases:
    // Single search query
    //    - match selected value if selected,
    //    - or reset to query from props (empty by default)
    // Multiple search query
    //    - reset to query from props (empty by default)
    // Single/Multiple select query (no logic needed because user cannot change query)
    const {multiple, search, options} = self.props
    if (search) {
      const {value, query} = self.state
      if (!multiple && value != null && String(value) !== query) // single search
        self.state.query = String(getValueText(value, options))
      else if (multiple || value == null) // multiple or unselected single search
        self.state.query = self.props.query
      if (query !== self.state.query) self.state.options = self.getOptions(self.state.query)
    }
    toggleOpen.apply(this, arguments)
    self.unsubscribeEvents()
  }
  if (!self.openOptions) self.openOptions = function (e) {
    if (self.open) return
    const {onFocus, name, parse} = self.props
    if (onFocus) {
      const {value} = self.state
      onFocus.call(this, parse ? parse(value, name, e, self) : value, name, e, self)
    }
    if (e.defaultPrevented) return
    toggleOpen.apply(this, arguments)
    self.subscribeToEvents()
  }

  // Fuzzy Search ----------------------------------------------------------------------------------
  if (search) {
    if (!self.fuse) self.fuse = new Fuse([], fuzzyOpt)
    if (!self.getOptions) self.getOptions = function (query) {
      return self.fuse.search(query).map(v => v.item)
    }
    if (!self.searchQuery) self.searchQuery = function (e) {
      const {onSearch, name} = self.props
      const query = e.target.value
      if (onSearch) onSearch.call(this, query, name, e, self)
      if (e.defaultPrevented) return
      self.setState({query, focusIndex: 0})
      self.openOptions.apply(this, arguments) // reopen if it was closed when Enter pressed
      self.updateOptions(query)
    }
    if (!self.updateOptions) self.updateOptions = debounce((query) => {
      if (self.willUnmount) return
      self.setState({options: query ? self.getOptions(query) : getOptionsFiltered(self), query})
    }, TIME_DURATION_INSTANT)
  }

  // Sync Options prop with state ------------------------------------------------------------------
  options = useMemo(() => getOptionsFiltered(self), [state.value, options])
  useMemo(() => {
    self.state.options = options
    if (!search) return
    const {query} = self.state
    self.fuse.setCollection(toFuseList(options))
    if (query) self.state.options = self.getOptions(query) // initial mount and subsequent updates
  }, [search, options])

  // Accessibility ---------------------------------------------------------------------------------
  if (!self.subscribeToEvents) self.subscribeToEvents = function () {
    if (self.subscribed) return
    self.subscribed = true
    subscribeTo('keydown', self.press)
    subscribeTo('pointerdown', self.click)
  }
  if (!self.unsubscribeEvents) self.unsubscribeEvents = function () {
    if (!self.subscribed) return
    self.subscribed = false
    unsubscribeFrom('keydown', self.press)
    unsubscribeFrom('pointerdown', self.click)
  }
  if (!self.click) self.click = function (e) {
    if (!self.node || !self.open) return
    // Ignore clicks originating from this Select instance (anything within this node)
    if (e.target === self.node) return
    let node = e.target
    while (node.parentElement) {
      node = node.parentElement
      if (node === self.node) return
    }
    self.hasFocus = false
    self.closeOptions.apply(this, arguments) // If clicked outside - close this
  }
  if (!self.press) self.press = function (e) {
    if (!isPureKeyPress(e) || !self.scrollNode || !self.inputNode) return
    // Check that keypress originates from this Select instance (input or options node)
    if (e.target !== self.inputNode && e.target !== self.node && e.target.parentElement !== self.scrollNode)
      return
    switch (e.keyCode) {
      case KEY.ArrowDown:
        e.preventDefault() // prevent scrolling within outer parent
        return self.setOptionFocus(self.state.focusIndex + (self.upward ? -1 : 1))
      case KEY.ArrowUp:
        e.preventDefault() // prevent scrolling within outer parent
        return self.setOptionFocus(self.state.focusIndex + (self.upward ? 1 : -1))
      case KEY.Enter: {// Enter will open dropdown or select the focusIndex option in the result
        if (e.target !== self.inputNode && e.target !== self.node) return
        if (!self.open) return self.openOptions.call(this, e)
        const {query, options, focusIndex} = self.state
        const {addOption} = self.props
        // prevent event propagation to onClick that toggles open state, or selects accidentally
        if (!options.length && !addOption) return e.preventDefault()
        let selected = options.length ? options[focusIndex] : null
        if (selected == null && addOption && query) selected = trimSpaces(query)
        if (selected == null) return e.preventDefault()
        self.selectOption.call(this, selected, ...arguments)
        return e.stopPropagation() // allow closing after selection for single select
      }
      case KEY.Backspace: {// input search Backspace will delete the last selected option
        const {multiple} = self.props
        if (!multiple || e.target !== self.inputNode) return
        const {query, value} = self.state
        if (query || !value || !value.length) return
        self.deleteValue.call(this, last(value), ...arguments)
        return e.preventDefault()
      }
      case KEY.Escape: {
        if (e.target !== self.inputNode && e.target !== self.node) return
        e.stopPropagation()
        self.hasFocus = false
        return self.closeOptions.apply(this, arguments)
      }
    }
  }
  if (!self.setOptionFocus) self.setOptionFocus = function (focusIndex) {
    if (!self.open || !self.scrollNode || !self.inputNode) return
    // First actually focus on the option to scroll if necessary, excluding noOptionsMsg
    const length = self.scrollNode.children.length + (!self.state.options.length ? -1 : 0)
    focusIndex = setFocus(self.scrollNode.children, focusIndex, length)
    // Then focus back to input for possible query change, keeping focused state
    self.inputNode.focus()
    self.setState({focusIndex})
  }
  if (self.open) self.subscribeToEvents()
  useEffect(() => self.unsubscribeEvents, [])
  const optPos = self.getOptionsPosition()
  const listBox = {
    role: 'listbox', 'aria-expanded': open,
    style: (fixed && !defaultOpen) ? self.getOptStyle(optPos, upward ? 'top' : 'bottom') : null,
    scrollProps: self.scrollProps,
  }
  self.upward = upward = upward && (!optPos || optPos.canBeUpward || optPos.optimalPosition.bottom > 0)

  // UI Props --------------------------------------------------------------------------------------
  value = state.value
  query = state.query
  options = state.options // filtered by search results and selected values
  focusIndex = state.focusIndex // focused selection without actual focus
  const hasValue = multiple ? hasListValue(value) : value != null
  if (hasValue) delete props.placeholder // remove for multiple search

  // Options Props ---------------------------------------------------------------------------------
  const optionsProps = {}
  if (addOption && search && query)
    optionsProps.addOption = addOptionItem(query, options, addOptionMsg, value)
  if (!options.length) optionsProps.noOptionsMsg = noOptionsMsg

  // Compact Input ---------------------------------------------------------------------------------
  // Logic to get compact input width:
  //   - Take the maximum char count from: placeholder?, value?, options? if open
  //   - set input box-sizing to content-box
  const {placeholder} = props
  const styleI = useMemo(() => {
    // Prevent flickering when selecting the first value in multiple (no width should be set)
    if (!compact && !(multiple && hasValue)) return
    let maxContent = query || placeholder || ''
    if (!multiple && open && options.length) {
      if (isObject(options[0])) {
        for (const {text} of options) {
          if (text.length > maxContent.length) maxContent = text
        }
      } else {
        for (const o of options) {
          if (o.length > maxContent.length) maxContent = o
        }
      }
    }
    return resizeWidth(maxContent, {}, compact)
  }, [hasValue, query, compact, multiple, open, options, placeholder])

  // Render Icon -----------------------------------------------------------------------------------
  const iconNode = icon ? // Let default Icon pass click through to parent Select
    <Icon name={isString(icon) ? icon : (search ? 'search' : 'dropdown')}
          {...{className: 'fade', ...iconProps}} /> : null
  let isIconEnd = iconEnd || (!search && !isString(icon))

  // Input value should be:
  //    - query: for search selection
  //    - value: for single selection
  // Multiple selection does not use input to display value, only single selection
  // => sync query with value onChange for single selection, then use `query` for input

  return ( // When Select is open, assign 'active' CSS class to be consistent with other Input types
    <Row className={cn(className, `select`,
      {active: open, done: hasValue, compact, multiple, search, upward, query})} style={style}
         {...{row}} onClick={toggleOpen} tabIndex={-1} _ref={self.ref}>
      {childBefore != null && renderProp(childBefore, self)}
      {!isIconEnd && iconNode}

      {/* Multiple selected items */}
      {multiple && value && value.map(v => {
        const {text, key = v} = getOptionByValue(v, self.props.options)
        // Use <a> tag, so it can link to another page as selected Tag
        return <a key={key} onClick={onClickValue && onEventStopPropagation(function (e) {
          onClickValue.call(this, v, name, e, self)
        })}>
          <Text>{text}</Text><Icon name='delete' onClick={onEventStopPropagation(function () {
          self.deleteValue.call(this, v, ...arguments)
        })} tabIndex={-1} />
        </a>
      })}
      <input className={cn('select__input', {'fill-width': !compact && (multiple || !hasValue), iconEnd: isIconEnd})}
             style={styleI}
             readOnly={!search} {...props} ref={self.ref1}
             value={query} onChange={self.searchQuery} onFocus={self.focus} onBlur={self.blur}
             onClick={search ? onEventStopPropagation(self.openOptions, props.onClick) : void 0} />
      {isIconEnd && iconNode}
      {childAfter != null && renderProp(childAfter, self)}
      <Scroll className={cn('select__options', {open, upward, fixed: listBox.style})}
              noScrollOffset reverse={upward} _ref={self.ref2} {...listBox}>
        {(forceRender || open) &&
          <SelectOptions items={options} {...{multiple, search, query, value, focusIndex}}
                         onFocus={self.focusOption} onBlur={self.blurOption} onClick={self.selectOption}
                         tabIndex={-1} // tab moves to the next input + avoid focusIndex mismatch
                         {...optionsProps} />}
      </Scroll>
    </Row>
  )
}

Select.defaultProps = {
  // Will be used if input value = ''
  get placeholder () {return _.SELECT},
  get addOptionMsg () {return _.__ADD___term__},
  get noOptionsMsg () {return _.NO_OPTIONS_AVAILABLE},
  focusIndex: 0,
  // Fuzzy search options // https://fusejs.io/demo.html
  // The default works even if the options is a list of Strings (does not work with number)
  fuzzyOpt: {keys: ['text']},
  // Default to empty string to prevent React controlled input error
  query: '',
  // Default is 'dropdown' icon at the end, or 'search' icon at the start if `search = true`
  icon: true,
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
  )).isRequired,
  // Handler(value: any, name?, event, self) when selected value changes
  onChange: type.Function,
  // Handler(value: any, name?: string, event: Event, self) on select focus
  onFocus: type.Function,
  // Handler(value: any, name?: string, event: Event, self) on select blur
  onBlur: type.Function,
  // Handler(query: string, name?, event, self) when search input value changes
  onSearch: type.Function,
  // Handler(value: any, name?, event, self) when an option gets focus
  onSelect: type.Function,
  // Handler(value: any, name?, event, self) when a multiple selected value is clicked
  onClickValue: type.Function,
  // Handler(value, name) when a new option is added
  // onAddOption: type.Function,

  // Whether to allow users to add new options (in combination with search)
  addOption: type.OneOf(type.Boolean, type.Object),
  // Whether to use minimal width that fits content, pass number for additional character offset
  compact: type.OneOf(type.Boolean, type.Number),
  // Whether to open options initially
  defaultOpen: type.Boolean,
  // Function(value, name?, event?, self) => any - Serializer for internal Select value
  format: type.Function,
  // Function(value, name?, event, self) => any - Deserializer for onChange value
  parse: type.Function,
  // Whether to always render options, even when closed
  forceRender: type.Boolean,
  // Whether to use an icon, pass Icon name for custom Icon
  icon: type.OneOf(type.String, type.Boolean),
  // Whether to place Icon after input, default is before input for custom Icon name
  iconEnd: type.Boolean,
  // Icon component props to pass over
  iconProps: type.Object,
  // Whether to allow multiple selections and store values as array
  multiple: type.Boolean,
  // Whether to set options with position fixed on open to remain visible inside Scroll
  fixed: type.Boolean,
  // Default search query to use
  query: type.String,
  // Whether to enable search by options, pass Handler(query, options) => value for custom search
  search: type.OneOf(type.Boolean, type.Function),
  // Whether options menu should try to open from the top, default is from the bottom
  upward: type.Boolean,
  // Selected value(s) - if passed, becomes a controlled component
  value: type.OneOf(type.String, type.Number, type.Boolean, type.List),
  // Message to display when there are no options left for multiple select
  noOptionsMsg: type.String,
  // Message to display when there are no matching results for search select
  // noResultsMsg: type.String, // not needed, use the same `noOptionsMsg`
  // ...other native `<input>` props
}

export default React.memo(Select)

function toFuseList (options) {
  if (!options.length) return options
  if (!isObject(options[0])) return options.map(v => String(v))
  return options
}

function getOptionsPosition (self = this) {
  if (!self.node || !self.optNode || !self.scrollNode) return
  let {top: topAvail, left, bottom: top, width, height} = self.node.getBoundingClientRect()
  const {height: actualHeight} = self.scrollNode.getBoundingClientRect()
  let maxHeight = +getComputedStyle(self.optNode).getPropertyValue('max-height').replace('px', '')
  if (!maxHeight) throw Error('Select options must have explicit max-height!')
  maxHeight = Math.min(actualHeight, maxHeight)
  const bottomAvail = window.innerHeight - topAvail - height
  let style = getComputedStyle(self.node)
  const bTop = +style.getPropertyValue('border-top-width').replace('px', '')
  const bBottom = +style.getPropertyValue('border-bottom-width').replace('px', '')
  const bottom = window.innerHeight - topAvail - bTop
  top -= bBottom
  style = null
  return {
    canBeUpward: topAvail - maxHeight > 0,
    canBeDownward: bottomAvail > maxHeight,
    optimalPosition: bottomAvail > topAvail ? {top, left} : {bottom, left}, // where there is more space
    bottom, // upward placement bottom position
    top, // downward placement top position
    left,
    width,
  }
}

function getFixedOptionsStyle (optionsPosition, desiredPosition) {
  if (!optionsPosition) return
  const {canBeUpward, canBeDownward, optimalPosition, bottom, top, left, width} = optionsPosition

  function getStyle () {
    switch (desiredPosition) {
      case 'top':
        if (canBeUpward) return {bottom, left} // place upwards
        if (canBeDownward) return {top, left} // place downwards
        return optimalPosition
      case 'bottom':
      default: // try to put options downwards, if there is enough space in viewport
        if (canBeDownward) return {top, left} // place downwards
        if (canBeUpward) return {bottom, left} // place upwards
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

function getOptionByValue (value, options) {
  return (options.length && isObject(options[0]) &&
      options.find(({text, value: v = text}) => v === value)) ||
    {value, key: value, text: String(value)}
}

// Options array without selected values for `multiple` Select
function getOptionsFiltered (self) {
  // given options should the original prop to reduce re-calculation
  // then feed fuzzy search with filtered options.
  let {options, multiple} = self.props
  const {value: v} = self.state
  if (multiple && v && v.length && options.length) {
    if (isObject(options[0])) options = options.filter(({text, value = text}) => !v.includes(value))
    else options = options.filter(value => value !== v)
  }
  return options
}

localiseTranslation({
  SELECT: {
    [l.ENGLISH]: 'Select',
  },
  __ADD___term__: {
    [l.ENGLISH]: '+ Add "{term}"',
  },
  NO_OPTIONS_AVAILABLE: {
    [l.ENGLISH]: 'No Options Available',
  },
})
