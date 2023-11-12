// noinspection JSValidateTypes,JSCheckFunctionSignatures
// noinspection JSCheckFunctionSignatures
import { _, debounce, isFunction, subscribeTo, translate, trimSpaces, unsubscribeFrom } from '@webframer/js'
import { hasListValue, last, toUniqueListFast } from '@webframer/js/array.js'
import { KEY, l, TIME_DURATION_INSTANT } from '@webframer/js/constants.js'
import { isPureKeyPress } from '@webframer/js/keyboard.js'
import { isEqual, isObject } from '@webframer/js/object.js'
import cn from 'classnames'
import Fuse from 'fuse.js'
import * as React from 'react'
import { useEffect, useId, useMemo } from 'react'
import Icon from '../components/Icon.js'
import Loader from '../components/Loader.js'
import { Row } from '../components/Row.js'
import Text from '../components/Text.js'
import { assignRef, toReactProps, useExpandCollapse, useInstance, useSyncedState } from '../react.js'
import { renderProp } from '../react/render.js'
import { type } from '../types.js'
import { resizeWidth, setFocus } from '../utils/element.js'
import { onEventStopPropagation } from '../utils/interaction.js'
import { renderInputIcon, renderInputLabel } from './InputNative.js'
import Label from './Label.js'
import SelectOptions from './SelectOptions.js'

/**
 * Dropdown List of Searchable Select Options and Nested Category Hierarchy.
 * @see https://webframe.app/docs/ui/inputs/Select
 * Features:
 *    1. Select (with options like `<select/>` element)
 *    2. Multiple select
 *    3. Search select (+ multiple)
 *    4. Customisable fuzzy search with cached indexing for large collections
 *    5. Infinite scroll with fast rendering using `<VirtualList/>`
 *    6. Group options by category, or render any custom UI via `optionsProps`
 *    7. Overlay options when inside overflow-hidden parent with `fixed={true}`
 *    8. Editable selected options with custom `renderSelected` function using `<InputView/>`
 *    9. Supports all features of `<InputNative/>`
 *    10. Keyboard friendly (arrows to move, `Enter` to select/open, `Escape` to close, `Tab` to blur)
 *    11. todo: improvement - Copy/Paste selected options via keyboard, like native input.
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
 *         @see https://www.django-rest-framework.org/api-guide/serializers/
 *
 * @example:
 *    // Format backend data to frontend value
 *    <Select format={(v) => v.split(' ')} />
 *    // which is equivalent to
 *    serialize('row reverse')
 *    >>> ['row', 'reverse']
 *
 *    // Parse frontend value to backend data
 *    <Select parse={(v) => v.join(' ')} />
 *    // which is equivalent to
 *    deserialize(['row', 'reverse'])
 *    >>> 'row reverse'
 */
export function Select ({
  options, defaultValue, name, openInitially, searchOptions, searchNonce, focusIndex,
  multiple, query, search, compact, controlledValue, excludeSelected, forceRender, fixed, upward,
  onChange, onFocus, onBlur, onRemove, onSearch, onSelect, onClickValue, onMount, queryParser,
  icon, iconEnd,
  addOption, addOptionMsg, noOptionsMsg, optionProps, optionsProps, virtualOptionsMinimum,
  format, parse, normalize, // these are serializer and deserializer
  type, // not used
  float, error, label, loading, prefix, suffix, stickyPlaceholder,
  childBefore, childAfter, className, style, row,
  _ref, inputRef, id = useId(), renderSelected, initialValues: _1, ...input
}) {
  input = toReactProps(input)
  let {value = defaultValue} = input
  const [self, state] = useInstance({options, query, value, focusIndex})
  let [{open, animating}, toggleOpen, ref] = useExpandCollapse(openInitially)
  self.toggleOpen = toggleOpen
  self.open = open // for internal logic
  self.animating = animating // to prevent multiple opening when toggling Label -> input to close
  open = open || animating // for rendering and styling
  state.open = open // for external components to check
  useEffect(() => {
    self.didMount = true
    if (onMount) onMount(self)
    return () => {self.willUnmount = true}
  }, [])
  const [, changedValue] = useSyncedState({value: input.value})

  // Initialize once
  if (!self.props && value !== void 0) {
    if (format) state.value = format(value, name, self)
    if (!multiple) state.query = getValueText(value, options)
  }

  // Controlled state
  else if (input.value !== void 0 && (changedValue || controlledValue)) {
    // State should store pure value as is, because `value` can be an array for multiple selection
    // Then let the render logic compute what to display based on given value.
    // For single selection, when no custom option render exists, input shows text value.
    state.value = format ? format(input.value, name, self) : input.value
    if (!multiple) state.query = getValueText(input.value, options)
  }
  query = state.query

  // Simulate class instance props
  self.props = arguments[0]

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
  if (!self.onFocus) {
    self.onFocus = function (e) {
      self.hasFocus = true
      self.openOptions.apply(this, arguments)
    }
    self.onFocusOption = function (e, item) {
      const {onSelect, name} = self.props
      self.hasFocus = true
      if (onSelect) onSelect.call(this, e, item, name, self) // pass selected item by reference
    }
    self.onBlur = function (e) {
      self.hasFocus = false
      if (self.open) setTimeout(() => self.closeOptions.call(this, e), 0)
    }
    self.onBlurOption = function (e) {
      self.hasFocus = false
      if (self.open) setTimeout(() => self.closeOptions.call(this, e), 0)
    }
    self.closeOptions = function (e) {
      if (self.willUnmount || self.hasFocus || !self.open) return
      const {onBlur, name} = self.props
      if (onBlur) onBlur.call(this, e, self.getParsedValue.call(this, e), name, self)
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
      if (e.keyCode !== KEY.Enter) self.unsubscribeEvents()
    }
    self.openOptions = function (e) {
      // When clicking on Label, if already focused, the input first gets `blur` event
      // => this calls closeOptions as expected.
      // Then immediately, Label causes input to receive 'focus',
      // so this handler is triggered multiple times: 'focus', then 'click'.
      // => this is undesired behavior, so we disable it if there is closing animation.
      if (self.open || self.animating) return
      const {onFocus, name} = self.props
      if (onFocus) onFocus.call(this, e, self.getParsedValue.call(this, e), name, self)
      if (e.defaultPrevented) return
      self.open = true // prevent further callback firing multiple times
      self.subscribeToEvents()
      toggleOpen.apply(this, arguments)
    }

    /**
     * Change single Select value, or add option to multiple Select values when option is clicked
     * @param {Event|KeyboardEvent} e
     * @param {any} item - option's value or `type.Option` object to set/add as selected value(s)
     */
    self.selectOption = function (e, item) {
      const {multiple, onChange, name} = self.props
      let {value = item, text = value} = isObject(item) ? item : {}
      if (multiple) value = toUniqueListFast((self.state.value || []).concat(value))
      if (onChange) onChange.call(this, e, self.getParsedValue.call(this, e, value), name, self)
      if (e.defaultPrevented) return
      const options = getOptionsFiltered(self) // compute new options to get next focus index
      self.setState({
        value, query: multiple ? '' : String(text), options,
        focusIndex: options.findIndex(i => i === item),
      })
      if (multiple && self.inputNode) self.inputNode.focus()
      if (self.open && !(self.hasFocus = multiple && e.keyCode !== KEY.Enter))
        setTimeout(() => self.closeOptions.call(this, e), 0)
    }

    // Remove selected value from multiple Select
    self.deleteValue = function (e, val) {
      const value = self.state.value.filter(v => v !== val)
      self.changeValue(e, value)
    }

    // Update selected value by index for multiple Select (for custom `renderSelected` editing)
    self.updateValue = function (e, val, index) {
      let value = [...self.state.value || []]
      value[index] = val
      value = toUniqueListFast(value) // filter duplicates after edit
      self.changeValue(e, value)
    }

    // Change Select value(s)
    self.changeValue = function (e, value) {
      const {onChange, name} = self.props
      if (onChange) onChange.call(this, e, self.getParsedValue.call(this, e, value), name, self)
      if (e.defaultPrevented) return
      self.setState({value}) // options get filtered by `useMemo` below when `state.value` changes
    }

    // Delete field handler
    self.onRemove = function (e) {
      const {onRemove, name} = self.props
      if (onRemove) onRemove.call(this, e, self.getParsedValue.call(this, e), name, self)
      if (e.defaultPrevented) return
      self.changeValue.call(this, e, null)
    }

    self.getParsedValue = function (e, value = self.state.value) {
      const {parse, name} = self.props
      if (parse) value = parse.call(this, value, name, self, e)
      return value
    }
  }

  // Remove handler --------------------------------------------------------------------------------
  if (onRemove) iconEnd = {name: 'delete', onClick: self.onRemove}

  // Fuzzy Search ----------------------------------------------------------------------------------
  if (search) {
    if (!self.fuse) self.fuse = new Fuse([], {...fuzzyOpt, ...searchOptions})
    if (!self.searchQuery) self.searchQuery = function (e, query = e.target.value) {
      const {onSearch, name, normalize} = self.props
      if (normalize) {
        const rawValue = query
        query = normalize.call(this, query, name, self, e)
        if (e.defaultPrevented) return
        if (isEqual(query, self.state.query)) {
          const {target} = e // prevent cursor jump to the end
          if (target?.setSelectionRange) {
            const cursorPos = target.selectionStart - (rawValue?.length - query?.length)
            if (cursorPos >= 0) setTimeout(() => target.setSelectionRange(cursorPos, cursorPos), 0)
          }
          return
        }
      }
      if (onSearch) onSearch.call(this, e, query, name, self)
      if (e.defaultPrevented) return
      self.setState({query, focusIndex: 0})
      if (!self.open) self.openOptions.apply(this, arguments) // reopen on search if it was closed
      self.updateOptionsDebounced(query)
    }
    if (!self.getOptions) self.getOptions = function (query) {
      const {queryParser} = self.props
      if (queryParser) query = queryParser(query)
      if (!query) return getOptionsFiltered(self)
      return self.fuse.search(query).map(v => v.item) // returns no result for empty string
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
          self.selectOption.call(this, e, selected)
          return e.stopPropagation() // allow closing after selection for single select
        }
        case KEY.Backspace: {// input search Backspace will delete the last selected option
          const {multiple} = self.props
          if (!multiple || e.target !== self.inputNode) return
          const {query, value} = self.state
          if (query || !value || !value.length) return
          self.deleteValue.call(this, e, last(value))
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
  const {readOnly: readonly} = input
  const hasValue = multiple ? hasListValue(value) : value != null
  if (hasValue) delete input.placeholder // remove for multiple search
  else if (!search && value === null) query = '' // show `null` value as placeholder
  if (loading) input.disabled = true
  const disabled = input.disabled

  // Compact Input ---------------------------------------------------------------------------------
  // Logic to get compact input width:
  //   - Take the maximum char count from: placeholder?, value?, options? if open
  //   - set input box-sizing to content-box
  const {placeholder} = input
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
  if (icon) icon = renderInputIcon(icon, self, {id})
  if (iconEnd) iconEnd = renderInputIcon(iconEnd, self, {id})
  let iconDefault = icon == null && iconEnd == null && renderInputIcon({
    className: 'fade',
    name: search ? 'search' : 'dropdown',
  }, self, {id})
  if (iconDefault) {
    if (search) icon = iconDefault
    else iconEnd = iconDefault
  }

  // Label -----------------------------------------------------------------------------------------
  if (label != null) label = renderInputLabel(label, self, input)

  // Sticky Placeholder ----------------------------------------------------------------------------
  if (stickyPlaceholder) {
    const {placeholder} = self.props
    stickyPlaceholder = placeholder && placeholder.substring(query.length)
  }

  // Render Props ----------------------------------------------------------------------------------
  if (multiple && !self.renderSelected) self.renderSelected = function (v) {
    if (self.props.renderSelected) return self.props.renderSelected.call(this, ...arguments, self)
    const {onClickValue, options, name} = self.props

    // Note: options can be large collections, so this operation can be expensive.
    // We only need to find the option if it's an object with `text` different from `value`.
    // Using `(o || {})` is a cheap way of finding objects, but not foolproof,
    // because `new String(value)` may also have `.value` prop that accidentally matches `v`.
    // => use custom `renderSelected` function for such cases to skip `options.find` call.
    const {text = String(v), key = v} = (options.length && options.find(o => (o || {}).value === v)) || {}

    // Use <a> tag, so it can link to another page as selected Tag
    return (
      <a className='select__value' key={key}
         onClick={onClickValue && onEventStopPropagation(function (e) {
           onClickValue.call(this, e, v, name, self)
         })}>
        <Text className='select__value__text'>{text}</Text>
        <Icon className='select__value__delete' name='delete'
              onClick={onEventStopPropagation(function (e) {
                self.deleteValue.call(this, e, v)
              })} tabIndex={-1} />
      </a>
    )
  }
  compact = compact != null && compact !== false // convert to boolean for rendering

  // Input value should be:
  //    - query: for search selection
  //    - value: for single selection
  // Multiple selection does not use input to display value, only single selection
  // => sync query with value onChange for single selection, then use `query` for input

  // When Select is open, assign 'active' CSS class to be consistent with other Input types
  return (<>
    {label}
    <Row className={cn(className, `select`, {
      active: open, done: hasValue, multiple, search, upward, query,
      compact, disabled, readonly, loading, error,
    })} style={style} {...{row}} _ref={self.ref}>
      {childBefore != null && renderProp(childBefore, self)}
      {icon}

      {/* Multiple selected items */}
      {multiple && value && value.map(self.renderSelected)}

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
        id={id} readOnly={!search} {...input} ref={self.inputRef}
        value={query} onChange={self.searchQuery} onFocus={self.onFocus} onBlur={self.onBlur}
        {...!self.open && {
          onClick: onEventStopPropagation(self.openOptions, input.onClick),
          onKeyUp: onEventStopPropagation(self.pressInput, input.onKeyUp),
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

      {loading && <Loader loading size='smaller' />}
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
  // Handler(event, value: any, name?, self) when selected value changes
  onChange: type.Function,
  // Handler(event, value: any, name?: string, self) on select focus
  onFocus: type.Function,
  // Handler(event, value: any, name?: string, self) on select blur
  onBlur: type.Function,
  // Handler(event, value: any, name?: string, self) on input removal.
  // `onChange` handler will fire after with `null` as value, unless event.preventDefault().
  // To let `onChange` update form instance first before removing the field,
  // use setTimeout to execute code inside `onRemove` handler.
  onRemove: type.Function,
  // Handler(event, query: string, name?, self) when search input value changes
  onSearch: type.Function,
  // Handler(event, value: any, name?, self) when an option gets focus
  onSelect: type.Function,
  // Handler(event, value: any, name?, self) when a multiple selected value is clicked
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
  openInitially: type.Boolean,
  // Whether to filter out selected value from options dropdown
  excludeSelected: type.Boolean,
  // Function(value, name?, self) => any - Serializer for internal Select state value
  format: type.Function,
  // Function(value, name?, self, event) => any - Deserializer for onChange/onBlur/onFocus value
  // Select always stores the `value` or `value[]` internally for its logic, like fuzzy search
  parse: type.Function,
  // Function(query, name?, self, event) => string - search query normalizer to sanitize user input
  normalize: type.Function,
  // Whether to always render options, even when closed
  forceRender: type.Boolean,
  // Custom Icon name or props to render before input node.
  // Default is 'dropdown' icon at the end, or 'search' icon at the start if `search = true`
  // and icons are undefined or null.
  icon: type.OneOf([type.String, type.Boolean, type.Object, type.NodeOrFunction]),
  // Custom Icon name or props to render after input node
  iconEnd: type.OneOf([type.String, type.Boolean, type.Object, type.NodeOrFunction]),
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
  // Function(value: any, index: number, array, self) => JSX - to render selected option.
  // Currently only works for `multiple` selections.
  renderSelected: type.Function,
  // Message string to display when there are no options left for multiple select, or
  // Handler(self) => string - function to render message dynamically (example: using query)
  noOptionsMsg: type.NodeOrFunction,
  // Minimum number of Select options to use Virtual List renderer to optimize for performance
  virtualOptionsMinimum: type.UnsignedInteger,
  // Message to display when there are no matching results for search select
  // noResultsMsg: type.String, // not needed, use the same `noOptionsMsg`
  // ...other native `<input>` props
}

const SelectMemo = React.memo(Select)
SelectMemo.name = Select.name
SelectMemo.propTypes = Select.propTypes
SelectMemo.defaultProps = Select.defaultProps
export default SelectMemo

// HELPERS -----------------------------------------------------------------------------------------

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
  if (Number.isNaN(maxHeight)) throw Error(`Select options must have explicit max-height, got ${maxHeight}`)
  maxHeight = Math.min(actualHeight, maxHeight || Infinity) // maxHeight can be 0 sometimes
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
