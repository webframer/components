import { __CLIENT__, isString, numericPattern, parseNumber } from '@webframer/js'
import cn from 'classnames'
import React, { useId, useState } from 'react'
import Icon from './Icon.jsx'
import Label from './Label.jsx'
import { assignRef, toReactProps } from './react.js'
import { useCompactStyle, useInputValue, useInstance } from './react/hooks.js'
import { renderProp } from './react/render.js'
import { Row } from './Row.jsx'
import Text from './Text.jsx'
import { type } from './types.js'

/**
 * Wrapper for Native HTML Input, such as: 'text', 'number', 'email', etc. where value is text.
 * Features:
 *  - Label added before input
 *  - Icon at the start or end of input
 *  - Loading state (with spinner icon and temporarily readonly input)
 *  - Controlled or uncontrolled input value state
 *  - Input unit prefix/suffix (ex. '$' prefix or 'USD' suffix for number input)
 *  - Compact input with automatic width adjustment
 *  - todo: improvement - Floating Label style
 */
export function InputNative ({
  float, error, icon, iconEnd, label, loading, prefix, suffix,
  childBefore, childAfter, className, style, reverse,
  _ref, ..._props
}) {
  const {active, compact, disabled, readonly, hasValue, value, id, props, self} = useInputSetup(_props)

  // Icon ------------------------------------------------------------------------------------------
  const iconNode = icon ? <Label className='input__icon' htmlFor={id}>{(isString(icon)
      ? <Icon name={icon} />
      : <Icon {...{icon}} />
  )}</Label> : null

  return (<>
    {label != null &&
      <Label className='input__label'>{renderProp(label, self)}</Label>}
    <Row className={cn(className, 'input', {active, compact, disabled, readonly, loading, error})}
         {...{_ref, reverse, style}}>
      {childBefore != null && renderProp(childBefore, self)}
      {!iconEnd && iconNode}
      {prefix != null &&
        <Label className='input__prefix' htmlFor={id}>{renderProp(prefix, self)}</Label>}
      {suffix != null && hasValue &&
        <Label className='input__suffix'>
          <Row>
            <Text className='invisible' aria-hidden='true'>{value}</Text>{renderProp(suffix, self)}
          </Row>
        </Label>
      }
      <input className={cn('input__field', {iconStart: !iconEnd && iconNode, iconEnd: iconEnd && iconNode})}
             {...props} ref={self.ref} />
      {iconEnd && iconNode}
      {childAfter != null && renderProp(childAfter, self)}
    </Row>
  </>)
}

InputNative.defaultProps = {
  type: 'text',
}

InputNative.propTypes = {
  // Whether to use minimal width that fits content, pass number for additional character offset
  compact: type.OneOf(type.Boolean, type.Number),
  // Initial value for uncontrolled state
  defaultValue: type.Any,
  // Internal value for controlled state
  value: type.Any,
  // Handler(value: any, name?: string, event: Event, self) on input value changes
  onChange: type.Function,
  // Handler(value: any, name?: string, event: Event, self) on input focus
  onFocus: type.Function,
  // Handler(value: any, name?: string, event: Event, self) on input blur
  onBlur: type.Function,
  // Label to show before the input (or after with `reverse` true)
  label: type.NodeOrFunction,
  // Whether input is loading
  loading: type.Boolean,
  // Function(value, name?, event?, self) => string - Input value formatter for UI display
  format: type.Function,
  // Function(value, name?, event, self) => any - Parser for internal Input value for onChange
  parse: type.Function,
  // Prefix to show before the Input value text
  prefix: type.NodeOrFunction,
  // Suffix to show after the Input value text (value must be non-empty)
  suffix: type.NodeOrFunction,
  // Custom UI to render before input node (inside .input wrapper with focus state)
  childBefore: type.NodeOrFunction,
  // Custom UI to render after input node (inside .input wrapper with focus state)
  childAfter: type.NodeOrFunction,
  // Custom Icon name or props
  icon: type.OneOf(type.String, type.Object),
  // Whether to place Icon after input node, default is before input node
  iconEnd: type.Boolean,
  // ...other native HTML `<input/>` props
}

/**
 * Common Input Behaviors Setup
 */
export function useInputSetup ({
  type, id = useId(), compact, format = formatByType[type], parse = parseByType[type],
  inputRef, ...props
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
      return assignRef.call(this, inputRef, ...arguments)
    }
    self.change = function (e) {
      let {value} = e.target
      const {name, onChange, parse} = self.props
      if (parse) value = parse(value, name, e, self)
      if (onChange) onChange.call(this, value, name, e, self)
      if (e.defaultPrevented) return
      // Same internal value does not re-render, but for input number,
      // we need to update UI when user types in numbers with trailing zeros: 1.020,
      // or anytime parse() function returns the same value, but format() does not.
      if (value === self.props.value) self.forceUpdate()
      setValue(value)
    }
    self.blur = function (e) {
      const {name, onBlur, value} = self.props
      if (onBlur) onBlur.call(this, value, name, e, self)
      if (e.defaultPrevented) return
      setFocus(false)
    }
    self.focus = function (e) {
      const {name, onFocus, value} = self.props
      if (onFocus) onFocus.call(this, value, name, e, self)
      if (e.defaultPrevented) return
      setFocus(true)
    }
    // Fix for Safari/Firefox bug returning empty input value when typing invalid characters
    if (type === 'number' && __CLIENT__) self.keyPress = function (e) {
      const {onKeyPress} = self.props
      if (onKeyPress) onKeyPress.apply(this, arguments)
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
  compact = useCompactStyle(compact, value, props).compact

  // Render Props ----------------------------------------------------------------------------------
  const {disabled, readOnly: readonly} = props
  if (format) value = props.value = format(value, props.name, void 0, self)

  return {active: focus, compact, disabled, readonly, hasValue, value, id, props, self}
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
