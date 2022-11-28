// noinspection JSValidateTypes,JSCheckFunctionSignatures
// noinspection JSCheckFunctionSignatures
import {
  _,
  debounce,
  hasListValue,
  isFunction,
  isObject,
  isString,
  KEY,
  l,
  last,
  subscribeTo,
  TIME_DURATION_INSTANT,
  toUniqueListFast,
  translate,
  trimSpaces,
  unsubscribeFrom,
} from '@webframer/js'
import { isPureKeyPress } from '@webframer/js/keyboard.js'
import cn from 'classnames'
import Fuse from 'fuse.js'
import React, { useEffect, useId, useMemo } from 'react'
import Icon from './Icon.jsx'
import Label from './Label.jsx'
import { assignRef, toReactProps, useExpandCollapse, useInstance, useSyncedState } from './react.js'
import { renderProp } from './react/render.js'
import { Row } from './Row.jsx'
import SelectOptions from './SelectOptions.jsx'
import Text from './Text.jsx'
import { type } from './types.js'
import { resizeWidth, setFocus } from './utils/element.js'
import { onEventStopPropagation } from './utils/interaction.js'

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
 *
 * Usage:
 *    - To keep Select open while interacting with content inside dropdown:
 *      1. Set the container of interactive content with `onClick: onEventStopPropagation()`
 *      2. Set `onBlur: (e) => e.preventDefault()` with your custom logic.
 *
 * Notes:
 *    - `compact` true sets input to dynamic character width, and increases when options open.
 *    - Options use position `absolute` initially, even when `fixed` is set to true,
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
    options, defaultValue, name, defaultOpen, searchOptions, searchNonce, focusIndex,
    multiple, query, search, compact, controlledValue, excludeSelected, forceRender, fixed, upward,
    onChange, onFocus, onBlur, onSearch, onSelect, onClickValue, onMount, queryParser,
    icon, iconEnd,
    addOption, addOptionMsg, noOptionsMsg, optionProps, optionsProps, virtualOptionsMinimum,
    format, parse, // these are serializer and deserializer
    type, // not used
    float, error, label, loading, prefix, suffix, stickyPlaceholder,
    childBefore, childAfter, className, style, row,
    _ref, inputRef, id = useId(), ...props
  } = _props
  props = toReactProps(props)
  let {value = defaultValue} = props
  const [self, state] = useInstance({options, query, value, focusIndex})
  let [{open, animating}, toggleOpen, ref] = useExpandCollapse(defaultOpen)
  self.open = open // for internal logic
  self.animating = animating // to prevent multiple opening when toggling Label -> input to close
  open = open || animating // for rendering and styling
  state.open = open // for external components to check
  useEffect(() => {
    self.didMount = true
    if (onMount) onMount(self)
    return () => {self.willUnmount = true}
  }, [])
  const [, changedValue] = useSyncedState({value: props.value})

  // Initialize once
  if (!self.props && value !== void 0) {
    if (format) state.value = format(value, name, void 0, self)
    if (!multiple) state.query = getValueText(value, options)
  }

  // Controlled state
  else if (props.value !== void 0 && (changedValue || controlledValue)) {
    // State should store pure value as is, because `value` can be an array for multiple selection
    // Then let the render logic compute what to display based on given value.
    // For single selection, when no custom option render exists, input shows text value.
    state.value = format ? format(props.value, name, void 0, self) : props.value
    if (!multiple) state.query = getValueText(props.value, options)
  }
  query = state.query

  // Simulate class instance props
  self.props = _props

  // Node Handlers ---------------------------------------------------------------------------------
  if (!self.ref) {
    self.ref = function (node) {
      self.node = node
      return assignRef.call(this, _ref, ...arguments)
    }
    self.inputRef = function (node) {
      self.inputNode = node
      return assignRef.call(this, inputRef, ...arguments)
    }
    self.optionsRef = function (node) {
      self.optNode = node
      return assignRef.call(this, ref, ...arguments)
    }
    self.optionsScrollRef = (node) => self.scrollNode = node
    self.getOptionsPosition = getOptionsPosition
    self.getOptStyle = getFixedOptionsStyle
  }

  // Event Handlers --------------------------------------------------------------------------------
  if (!self.focus) {
    self.focus = function (e) {
      self.hasFocus = true
      self.openOptions.apply(this, arguments)
    }
    self.focusOption = function (item, e) {
      const {onSelect, name} = self.props
      self.hasFocus = true
      if (onSelect) onSelect.call(this, item, name, e, self) // pass selected item by reference
    }
    self.blur = function (e) {
      self.hasFocus = false
      if (self.open) setTimeout(() => self.closeOptions.call(this, e), 0)
    }
    self.blurOption = function (e) {
      self.hasFocus = false
      if (self.open) setTimeout(() => self.closeOptions.call(this, e), 0)
    }
    self.selectOption = function (item, e) { // options clicked
      const {multiple, onChange, name, parse} = self.props
      let {value = item, text = value} = isObject(item) ? item : {}
      if (multiple) value = toUniqueListFast((self.state.value || []).concat(value))
      if (onChange) onChange.call(this, parse ? parse(value, name, e, self) : value, name, e, self)
      if (e.defaultPrevented) return
      const options = getOptionsFiltered(self) // compute new options to get next focus index
      self.setState({
        value, query: multiple ? '' : String(text), options,
        focusIndex: options.findIndex(i => i === item),
      })
      if (multiple && self.inputNode) self.inputNode.focus()
      if (self.open && !(self.hasFocus = multiple)) setTimeout(() => self.closeOptions.call(this, e), 0)
    }
    self.deleteValue = function (val, e) {
      const {onChange, name, parse} = self.props
      const value = self.state.value.filter(v => v !== val)
      if (onChange) onChange.call(this, parse ? parse(value, name, e, self) : value, name, e, self)
      if (e.defaultPrevented) return
      self.setState({value})
    }
    self.closeOptions = function (e) {
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
          self.state.query = getValueText(value, options)
        else if (multiple || value == null) // multiple or unselected single search
          self.state.query = self.props.query
        if (query !== self.state.query) self.state.options = self.getOptions(self.state.query)
      }
      toggleOpen.apply(this, arguments)
      self.unsubscribeEvents()
    }
    self.openOptions = function (e) {
      // When clicking on Label, if already focused, the input first gets `blur` event
      // => this calls closeOptions as expected.
      // Then immediately, Label causes input to receive 'focus',
      // so this handler is triggered multiple times: 'focus', then 'click'.
      // => this is undesired behavior, so we disable it if there is closing animation.
      if (self.open || self.animating) return
      const {onFocus, name, parse} = self.props
      if (onFocus) {
        const {value} = self.state
        onFocus.call(this, parse ? parse(value, name, e, self) : value, name, e, self)
      }
      if (e.defaultPrevented) return
      self.open = true // prevent further callback firing multiple times
      self.subscribeToEvents()
      toggleOpen.apply(this, arguments)
    }
  }

  // Fuzzy Search ----------------------------------------------------------------------------------
  if (search) {
    if (!self.fuse) self.fuse = new Fuse([], {...fuzzyOpt, ...searchOptions})
    if (!self.getOptions) self.getOptions = function (query) {
      const {queryParser} = self.props
      if (queryParser) query = queryParser(query)
      if (!query) return getOptionsFiltered(self)
      return self.fuse.search(query).map(v => v.item) // returns no result for empty string
    }
    if (!self.searchQuery) self.searchQuery = function (e, query = e.target.value) {
      const {onSearch, name} = self.props
      if (onSearch) onSearch.call(this, query, name, e, self)
      if (e.defaultPrevented) return
      self.setState({query, focusIndex: 0})
      if (!self.open) self.openOptions.apply(this, arguments) // reopen on search if it was closed
      self.updateOptionsDebounced(query)
    }
    if (!self.updateOptions) {
      self.updateOptions = (query) => {
        if (self.willUnmount) return
        self.setState({options: self.getOptions(query), query})
      }
      self.updateOptionsDebounced = debounce(self.updateOptions, TIME_DURATION_INSTANT)
    }
  }

  // Sync Options prop with state ------------------------------------------------------------------
  options = useMemo(() => getOptionsFiltered(self), [state.value, options])
  useMemo(() => {
    self.state.options = options
    if (!search) return
    const {query} = self.state
    self.fuse.setCollection(toFuseList(options))
    if (query) self.state.options = self.getOptions(query) // initial mount and subsequent updates
  }, [search, searchNonce, options]) // query is updated by mutation

  // Accessibility ---------------------------------------------------------------------------------
  if (!self.subscribeToEvents) {
    self.subscribeToEvents = function () {
      if (self.subscribed) return
      self.subscribed = true
      subscribeTo('keydown', self.press)
      subscribeTo('click', self.click) // only propagated events get fired here
    }
    self.unsubscribeEvents = function () {
      if (!self.subscribed) return
      self.subscribed = false
      unsubscribeFrom('keydown', self.press)
      unsubscribeFrom('click', self.click)
    }
    self.click = function (e) {
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
    self.press = function (e) {
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
          if (selected == null && addOption && query && (!isFunction(addOption) || addOption(query)))
            selected = trimSpaces(query)
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
          self.closeOptions.apply(this, arguments)
          return e.preventDefault()
        }
      }
    }
    self.pressInput = function (e) { // Enter when dropdown is closed (unsubscribed from self.press)
      // This handler is needed to reopen dropdown after pressing Esc when in focus
      // Note that `e.keyCode !== KEY.Enter`, instead e.keyCode === 0 (like mouse click)
      if (!isPureKeyPress(e) || e.key !== 'Enter') return
      self.openOptions.apply(this, arguments)
    }
    self.setOptionFocus = function (focusIndex) {
      if (!self.open || !self.scrollNode || !self.inputNode) return
      const {addOption, search} = self.props
      const {query} = self.state
      if (focusIndex === -1 && addOption && search && query && (!isFunction(addOption) || addOption(query))) {
        // Focus on addOption
        setFocus(self.optNode.children, 0)
      } else {
        // Focus on the option to scroll if necessary
        // this returns -1 if no options available, thus automatically focusing on addOption
        focusIndex = setFocus(self.scrollNode.children, focusIndex, self.state.options.length)
      }
      // Then focus back to input for possible query change, keeping focused state
      self.inputNode.focus()
      self.setState({focusIndex})
    }
  }
  if (self.open) self.subscribeToEvents()
  useEffect(() => self.unsubscribeEvents, [])

  // UI Props --------------------------------------------------------------------------------------
  value = state.value
  options = state.options // filtered by search results and selected values
  focusIndex = state.focusIndex // focused selection without actual focus
  const optPos = self.optPos = self.getOptionsPosition()
  upward = self.upward = upward && (!optPos || optPos.canBeUpward || optPos.optimalPosition.bottom > 0)
  const {disabled, readOnly: readonly} = props
  const hasValue = multiple ? hasListValue(value) : value != null
  if (hasValue) delete props.placeholder // remove for multiple search
  else if (!search && value === null) query = '' // show `null` value as placeholder

  // Compact Input ---------------------------------------------------------------------------------
  // Logic to get compact input width:
  //   - Take the maximum char count from: placeholder?, value?, options? if open
  //   - set input box-sizing to content-box
  const {placeholder} = props
  self.styleInput = useMemo(() => {
    // Prevent flickering when selecting the first value in multiple (no width should be set)
    if ((compact == null || compact === false) && !(multiple && hasValue)) return
    let maxContent = query || placeholder || ''
    if (!multiple && open && options.length) {
      for (const o of options) {
        if (isObject(o)) {
          const {value, text = String(value)} = o
          if (text.length > maxContent.length) maxContent = text
        } else if (String(o).length > maxContent.length) maxContent = String(o)
      }
    }
    return resizeWidth(maxContent, {}, compact)
  }, [hasValue, query, compact, multiple, open, options, placeholder])

  // Icon ------------------------------------------------------------------------------------------
  if (icon) icon = (
    <Label className='input__icon' htmlFor={id}>{(isString(icon)
        ? <Icon name={icon} />
        : (isObject(icon) ? <Icon {...icon} /> : renderProp(icon, self))
    )}</Label>
  )
  if (iconEnd) iconEnd = (
    <Label className='input__icon' htmlFor={id}>{(isString(iconEnd)
        ? <Icon name={iconEnd} />
        : (isObject(iconEnd) ? <Icon {...iconEnd} /> : renderProp(iconEnd, self))
    )}</Label>
  )
  let iconDefault = icon == null && iconEnd == null && (
    <Label className='input__icon' htmlFor={id}>
      <Icon className='fade' name={search ? 'search' : 'dropdown'} />
    </Label>
  )
  if (iconDefault) {
    if (search) icon = iconDefault
    else iconEnd = iconDefault
  }

  // Sticky Placeholder ----------------------------------------------------------------------------
  if (stickyPlaceholder) {
    const {placeholder} = _props
    stickyPlaceholder = placeholder && placeholder.substring(query.length)
  }

  // Render Props ----------------------------------------------------------------------------------
  compact = compact != null && compact !== false // convert to boolean for rendering

  // Input value should be:
  //    - query: for search selection
  //    - value: for single selection
  // Multiple selection does not use input to display value, only single selection
  // => sync query with value onChange for single selection, then use `query` for input

  // When Select is open, assign 'active' CSS class to be consistent with other Input types
  return (<>
    {label != null &&
      <Label className='input__label'>{renderProp(label, self)}</Label>}
    <Row className={cn(className, `select`, {
      active: open, done: hasValue, multiple, search, upward, query,
      compact, disabled, readonly, loading, error,
    })} style={style} {...{row}} _ref={self.ref}>
      {childBefore != null && renderProp(childBefore, self)}
      {icon}

      {/* Multiple selected items */}
      {multiple && value && value.map(v => {
        const {text = String(v), key = v} = getOptionByValue(v, self.props.options)
        // Use <a> tag, so it can link to another page as selected Tag
        return <a key={key} onClick={onClickValue && onEventStopPropagation(function (e) {
          onClickValue.call(this, v, name, e, self)
        })}>
          <Text>{text}</Text><Icon name='delete' onClick={onEventStopPropagation(function () {
          self.deleteValue.call(this, v, ...arguments)
        })} tabIndex={-1} />
        </a>
      })}

      {/* Prefix + Suffix */}
      {prefix != null &&
        <Label className='input__prefix' htmlFor={id}>{renderProp(prefix, self, opts)}</Label>}
      {(stickyPlaceholder || suffix != null) && hasValue &&
        <Label className={cn('input__suffix', {iconStart: icon, iconEnd})}>
          <Row>
            <Text className='invisible' aria-hidden='true'>{query}</Text>
            {stickyPlaceholder ? <Text>{stickyPlaceholder}</Text> : renderProp(suffix, self, opts)}
          </Row>
        </Label>
      }

      <input
        className={cn('select__input', {'fill-width': !compact && (multiple || !hasValue), iconStart: icon, iconEnd})}
        style={self.styleInput}
        id={id} readOnly={!search} {...props} ref={self.inputRef}
        value={query} onChange={self.searchQuery} onFocus={self.focus} onBlur={self.blur}
        {...!self.open && {
          onClick: onEventStopPropagation(self.openOptions, props.onClick),
          onKeyPress: onEventStopPropagation(self.pressInput, props.onKeyPress),
        }}
      />

      {iconEnd}
      {childAfter != null && renderProp(childAfter, self)}
      <SelectOptions {...{
        fixed, open, upward, optionsProps,
        forceRender, virtualOptionsMinimum, self,
        addOption, addOptionMsg, options, noOptionsMsg,
        focusIndex, multiple, search, query, value, optionProps,
      }} />
    </Row>
  </>)
}

Select.defaultProps = {
  // Will be used if input value = ''
  get placeholder () {return _.SELECT},
  get addOptionMsg () {return _.__ADD___term__},
  get noOptionsMsg () {return _.NO_OPTIONS_AVAILABLE},
  focusIndex: 0,
  // Default to empty string to prevent React controlled input error
  query: '',
  virtualOptionsMinimum: 50,
}

Select.propTypes = {
  // Selectable values
  options: type.Options.isRequired,
  // Individual option props to pass
  optionProps: type.Object,
  // Options container props to pass
  optionsProps: type.Object,
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
  // Handler(self: object) when this component has mounted
  onMount: type.Function,
  /**
   * Whether to allow users to add new options (in combination with search)
   * Set to `true` to allow adding new term.
   * Set to `object` of props to pass to new `option` object when selected.
   * Set to `function(query: string) => boolean | object` for conditional logic.
   */
  addOption: type.OneOf([type.Boolean, type.Object, type.Function]),
  // Whether to use minimal width that fits content, pass number for additional character offset
  compact: type.OneOf([type.Boolean, type.Number]),
  // Whether to lock selected value when `value` prop is given
  controlledValue: type.Boolean,
  // Whether to open options initially
  defaultOpen: type.Boolean,
  // Whether to filter out selected value from options dropdown
  excludeSelected: type.Boolean,
  // Function(value, name?, event?, self) => any - Serializer for internal Select state value
  format: type.Function,
  // Function(value, name?, event, self) => any - Deserializer for onChange/onBlur/onFocus value
  // Select always stores the `value` or `value[]` internally for its logic, like fuzzy search
  parse: type.Function,
  // Whether to always render options, even when closed
  forceRender: type.Boolean,
  // Custom Icon name or props to render before input node.
  // Default is 'dropdown' icon at the end, or 'search' icon at the start if `search = true`
  // and icons are undefined or null.
  icon: type.OneOf([type.String, type.Object, type.Boolean, type.NodeOrFunction]),
  // Custom Icon name or props to render after input node
  iconEnd: type.OneOf([type.String, type.Object, type.Boolean, type.NodeOrFunction]),
  // Whether to allow multiple selections and store values as array
  multiple: type.Boolean,
  // Whether to set options with position fixed on open to remain visible inside Scroll
  fixed: type.Boolean,
  // Default search query to use
  query: type.String,
  // Function(query) => string - parse function for internal query string used for search
  queryParser: type.Function,
  // Whether to enable search by options, pass Handler(query, options) => value for custom search
  search: type.OneOf([type.Boolean, type.Function]),
  // Unique ID to trigger search options re-indexing
  searchNonce: type.Any,
  // Fuzzy [search options](https://fusejs.io/api/options.html)
  searchOptions: type.Obj({
    distance: type.Integer,
    threshold: type.Percent,
    /**
     * Goes along with `queryParser`
     * @example:
     *    // Filter options to include search `query`
     *    queryParser: (query) => `'${query}`
     *    searchOptions: {useExtendedSearch: true, ignoreLocation: true}
     */
    useExtendedSearch: type.Boolean,
  }),
  // Whether options menu should try to open from the top, default is from the bottom
  upward: type.Boolean,
  // Selected value(s) - if passed, becomes a controlled component
  value: type.Any,
  // Message string to display when there are no options left for multiple select, or
  // Handler(self) => string - function to render message dynamically (example: using query)
  noOptionsMsg: type.NodeOrFunction,
  // Minimum number of Select options to use Virtual List renderer to optimize for performance
  virtualOptionsMinimum: type.UnsignedInteger,
  // Message to display when there are no matching results for search select
  // noResultsMsg: type.String, // not needed, use the same `noOptionsMsg`
  // ...other native `<input>` props
}

export default React.memo(Select)

/**
 * Convert list of values to Select options, each as objects.
 * @note: does not work for symbols with the same string, because `key` is no longer unique
 * @param {any[]} arrayOfValues - to convert to options
 * @returns {object[]} options - for Select dropdown with values converted to text representation
 */
export function toSelectOptions (arrayOfValues) {
  let text
  return arrayOfValues.map((v) => ({value: v, text: text = String(v), key: text}))
}

function toFuseList (options) {
  if (!options.length) return options
  return options.map(v => isObject(v) ? (v.text ? v : {...v, text: String(v.value)}) : String(v))
}

function getOptionsPosition (self = this) {
  if (!self.node || !self.optNode || !self.scrollNode) return
  let {top: topAvail, left, bottom: top, width, height} = self.node.getBoundingClientRect()
  const {height: actualHeight} = self.scrollNode.getBoundingClientRect()
  let maxHeight = +getComputedStyle(self.optNode).getPropertyValue('max-height').replace('px', '')
  if (!maxHeight) throw Error(`Select options must have explicit max-height, got ${maxHeight}`)
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

/**
 * @param {any} value
 * @param {array} options
 * @returns {string} text
 */
function getValueText (value, options) {
  if (!options.length) return String(value)
  const o = options.find(o => o === value || (o && o.value === value))
  return String(o === void 0 ? value : (isObject(o) ? (o.text || o.value) : o))
}

function getOptionByValue (value, options) {
  return (options.length && options.find(o => (o || {}).value === value)) ||
    {value, key: value, text: String(value)}
}

// Options array without selected values for `multiple` Select or `excludeSelected`
function getOptionsFiltered (self) {
  // given options should the original prop to reduce re-calculation
  // then feed fuzzy search with filtered options.
  let {options, multiple, excludeSelected} = self.props
  const {value: v} = self.state
  if (multiple && v && v.length && options.length) {
    options = options.filter(o => !v.includes(isObject(o) ? o.value : o))
  } else if (excludeSelected && !multiple && v !== void 0) {
    options = options.filter(o => isObject(o) ? o.value !== v : o !== v)
  }
  return options
}

// Fuzzy search options // https://fusejs.io/demo.html
// The default works even if the options is a list of Strings (does not work with number)
const fuzzyOpt = {keys: ['text']}
const opts = {
  preserveSpace: true,
}

translate({
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
