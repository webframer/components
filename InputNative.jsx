import { __CLIENT__, numericPattern, parseNumber } from '@webframer/js'
import cn from 'classnames'
import React, { useId, useMemo, useState } from 'react'
import Label from './Label.jsx'
import { assignRef, toReactProps } from './react.js'
import { useInputValue, useInstance } from './react/hooks.js'
import { renderProp } from './react/render.js'
import { Row } from './Row.jsx'
import Text from './Text.jsx'
import { type } from './types.js'
import { resizeWidth } from './utils/element.js'

/**
 * Wrapper for Native HTML Input, such as: 'text', 'number', 'email', etc. where value is text.
 * Features:
 *  - Label added before input
 *  - Floating Label style
 *  - Icon at the start or end of input
 *  - Loading state (with spinner icon and temporarily readonly input)
 *  - Handles controlled or uncontrolled input value state
 *  - Input unit prefix/suffix (ex. '$' prefix or 'USD' suffix for number input)
 *  - Compact input with automatic width calculation
 *  - Auto-resize rows for textarea input as user enters content
 */
export function InputNative ({
  type, format = formatByType[type], parse = parseByType[type],
  compact, float, error, label, loading, prefix, suffix, id = useId(),
  _ref, ...props
}) {
  props.id = id
  props.type = type
  props = toReactProps(props)
  const [self] = useInstance()
  let [value, setValue] = useInputValue(props)
  const [focus, setFocus] = useState(props.autoFocus)
  const hasValue = value != null && value !== ''
  self.props = {...props, focus, format, value, parse}

  // Event Handlers --------------------------------------------------------------------------------
  if (!self.ref) {
    self.ref = function (node) {
      self.inputNode = node
      return assignRef.call(this, _ref, ...arguments)
    }
    self.change = function (e) {
      let {value} = e.target
      const {name, onChange, parse} = self.props
      if (parse) value = parse(value, name, e, self)
      if (onChange) onChange.call(this, value, name, ...arguments)
      if (e.defaultPrevented) return
      // Same internal value does not re-render, but for input number,
      // we need to update UI when user types in numbers with trailing zeros: 1.020,
      // or anytime parse() function returns the same value, but format() does not.
      if (value === self.props.value) self.forceUpdate()
      setValue(value)
    }
    self.blur = function (e) {
      const {name, onBlur, value} = self.props
      if (onBlur) onBlur.call(this, value, name, ...arguments)
      if (e.defaultPrevented) return
      setFocus(false)
    }
    self.focus = function (e) {
      const {name, onFocus, value} = self.props
      if (onFocus) onFocus.call(this, value, name, ...arguments)
      if (e.defaultPrevented) return
      setFocus(true)
    }
    // Fix for Safari/Firefox bug returning empty input value when typing invalid characters
    if (type === 'number' && __CLIENT__) self.keyPress = function (e) {
      const {onKeyPress} = self.props
      if (onKeyPress) onKeyPress.apply(this, ...arguments)
      if (e.defaultPrevented) return
      // Prevent Safari from sending empty value when there is invalid character
      if (!numericPattern().test(e.key)) e.preventDefault()
    }
  }
  if (self.keyPress) props.onKeyPress = self.keyPress
  props.onChange = self.change
  props.onBlur = self.blur
  props.onFocus = self.focus

  // Compact Input ---------------------------------------------------------------------------------
  const {placeholder} = props
  const styleCompact = useMemo(() => {
    if (compact == null || compact === false) return
    let maxContent = value == null ? '' : value
    if (placeholder && placeholder.length > maxContent.length) maxContent = placeholder
    return resizeWidth(maxContent, {}, compact)
  }, [compact, placeholder, value])
  compact = compact != null && compact !== false // convert to boolean for rendering
  if (compact) props.style = {...props.style, ...styleCompact}

  // Render Props ----------------------------------------------------------------------------------
  const {disabled, readOnly: readonly} = props
  if (format) value = props.value = format(value, props.name, void 0, self)

  return (<>
    {!float && label != null &&
      <Label className='input__label'>{renderProp(label, self)}</Label>
    }
    <Row className={cn('input', {active: focus, compact, error, disabled, readonly, loading})}>
      {prefix != null && <Label className='input__prefix' htmlFor={id}>{renderProp(prefix, self)}</Label>}
      {suffix != null && hasValue &&
        <Label className='input__suffix'>
          <Row>
            <Text className='invisible' aria-hidden='true'>{value}</Text>{renderProp(suffix, self)}
          </Row>
        </Label>
      }
      <input {...props} ref={self.ref} />
    </Row>
  </>)
}

InputNative.propTypes = {
  // Whether to take minimal width required to render input
  compact: type.OneOf(type.Boolean, type.Number),
  // Label to show before the Input (or after Input with `reverse` true)
  label: type.NodeOrFunction,
  // Function(value, name?, event?, self) => string - Input value formatter for UI display
  format: type.Function,
  // Function(value, name?, event, self) => any - Parser for internal Input value for onChange
  parse: type.Function,
  // Prefix to show before the Input value text
  prefix: type.NodeOrFunction,
  // Suffix to show after the Input value text (value must be non-empty)
  suffix: type.NodeOrFunction,
}

// Default formatter for Input value
const formatByType = {
  number: (value, name, event, self) => {
    if (self.inputValue === void 0) return value
    if (self.inputValue === null) return ''
    return self.inputValue // use the same value user typed in (`value` is the result of parseNumber)
  },
}

// Default parser for Input value
const parseByType = {
  number: (value, name, event, self) => {
    // Note: in Safari, if user types in a comma, onChange event only fires once with value = '',
    // even with valid values, like 1,000 - this is clearly a bug for input type number from Safari.
    // => on Safari, perform sanitization of all none numeric characters, to behave like Chrome
    self.inputValue = value // cache user typed in value for formatting later
    return parseNumber(value)
  },
}
