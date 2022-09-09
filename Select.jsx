// noinspection JSValidateTypes,JSCheckFunctionSignatures
import { _, debounce, isObject, l, localiseTranslation, TIME_DURATION_INSTANT } from '@webframer/js'
import cn from 'classnames'
import Fuse from 'fuse.js'
import React, { useEffect, useMemo } from 'react'
import { assignRef, useExpandCollapse, useInstance } from './react.js'
import { Row } from './Row.jsx'
import { Scroll } from './Scroll.jsx'
import Text from './Text.jsx'
import { type } from './types.js'

// import { View } from './View.jsx'

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
  options, query, search, defaultOpen, compact,
  forceRender, noFixedOptions, upward, addOption,
  childBefore, childAfter, className,
  multiple, onChange, onSearch, onSelect, onAddOption,
  ...props
}) {
  const [self, state] = useInstance({options, query})
  const [{open, animating}, toggleOpen, ref] = useExpandCollapse(defaultOpen)
  useEffect(() => (self.didMount = true) && (() => {self.willUnmount = true}), [])
  Object.assign(self, {multiple, options, onChange, onSearch, onSelect, onAddOption}, props)
  self.open = open

  // Node Handlers ---------------------------------------------------------------------------------
  if (!self.ref) self.ref = (node) => self.node = node
  if (!self.ref2) self.ref2 = function (node) {
    self.optNode = node
    return assignRef.apply(this, [ref, ...arguments])
  }
  if (!self.scrollProps) self.scrollProps = {ref: (node) => self.scrollNode = node}
  if (!self.getOptionsPosition) self.getOptionsPosition = getOptionsPosition
  if (!self.getOptStyle) self.getOptStyle = getFixedOptionsStyle

  // Event Handlers --------------------------------------------------------------------------------
  if (!self.focus) self.focus = function (e) {
    self.hasFocus = true
    if (!self.open) toggleOpen.apply(this, arguments)
    if (self.onFocus) return self.onFocus.apply(this, arguments)
  }
  if (!self.focusOption) self.focusOption = function () {
    self.hasFocus = true
    if (self.onSelect) return self.onSelect.apply(this, arguments)
  }
  if (!self.blur) self.blur = function () {
    self.hasFocus = false
    if (self.open) setTimeout(() => !self.hasFocus && toggleOpen.apply(this, arguments), 0)
    if (self.onBlur) return self.onBlur.apply(this, arguments)
  }
  if (!self.blurOption) self.blurOption = function () {
    self.hasFocus = false
    if (self.open) setTimeout(() => !self.hasFocus && toggleOpen.apply(this, arguments), 0)
  }
  if (!self.change) self.change = function () {
    self.hasFocus = self.multiple
    if (self.open) setTimeout(() => !self.hasFocus && toggleOpen.apply(this, arguments), 0)
    if (self.onChange) return self.onChange.apply(this, arguments)
  }

  // Fuzzy Search ----------------------------------------------------------------------------------
  if (search && !self.fuse) self.fuse = new Fuse([], fuseOpt)
  useMemo(() => search && (self.fuse.setCollection(toFuseList(options))), [search, options])
  if (search && !self.getOptions) self.getOptions = function (query) {
    const {options} = self
    return self.fuse.search(query).map(v => options[v.refIndex])
  }
  if (search && !self.search) self.search = function (e) {
    const query = e.target.value
    self.setState({query})
    self.updateOptions(query)
    if (self.onSearch) return self.onSearch.apply(this, [query, ...arguments])
  }
  if (search && !self.updateOptions) self.updateOptions = debounce((query) => {
    if (self.willUnmount) return
    self.setState({options: query ? self.getOptions(query) : options, query})
  }, TIME_DURATION_INSTANT)
  if (!self.didMount && search && query) self.state.options = self.getOptions(query)

  // Accessibility ---------------------------------------------------------------------------------
  const optPos = self.getOptionsPosition()
  const listBox = {
    role: 'listbox', 'aria-expanded': open,
    style: (defaultOpen || noFixedOptions) ? null : self.getOptStyle(optPos, upward ? 'top' : 'bottom'),
    scrollProps: self.scrollProps,
  }
  upward = upward && (optPos && (optPos.canBeUpward || optPos.optimalPosition.bottom > 0))

  return (
    <Row className={cn(className, `select wrap ${compact ? 'width-fit' : 'full-width'}`)}
         _ref={self.ref}>
      {childBefore}
      <input className={cn({'full-width': !compact})} readOnly={!search} {...props}
             {...state.query && {value: state.query}}
             onChange={self.search} onFocus={self.focus} onBlur={self.blur} />
      {childAfter}
      <Scroll _ref={self.ref2} noOffset className={cn('select__options', {open, upward})}
              {...listBox}>
        {(forceRender || open || animating) &&
          <Options items={state.options} query={state.query}
                   onFocus={self.focusOption} onBlur={self.blurOption} onChange={self.change} />}
      </Scroll>
    </Row>
  )
}

Select.defaultProps = {
  get placeholder () {return _.SELECT},
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
  // Handler(value: string | number | object, name, event) when selected value changes
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

// https://fusejs.io/demo.html
const fuseOpt = {
  keys: ['text'], // works even if the options is list of Strings (does not work with number)
}

function SelectOptions ({items, query, onFocus, onBlur, onChange, ...props}) {
  return (<>
    {items.map((item) => {
      let t, v, k
      if (isObject(item)) {
        const {text, value = text, key = String(value)} = item
        t = text
        v = value
        k = key
      } else {
        t = v = k = String(item)
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
                  onClick={(...args) => onChange(v, ...args)}
                  onFocus={(...args) => onFocus(v, ...args)}
                  onBlur={(...args) => onBlur(v, ...args)}
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

localiseTranslation({
  SELECT: {
    [l.ENGLISH]: 'Select',
  },
})
