import { __CLIENT__, isEqual, isObject, isString, numericPattern, parseNumberLocale } from '@webframer/js'
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
import { extractProps } from './View.jsx'

/**
 * Wrapper for Native HTML Input, such as: 'text', 'number', 'email', etc. where value is text.
 *
 * Features:
 *  1. format and parse functions
 *  2. Label added before input
 *  3. Icon at the start or end of input
 *  4. Input prefix/suffix (ex.'$' prefix or 'USD' suffix for number input)
 *  5. Loading state (with spinner icon and temporarily readonly input)
 *  6. Controlled or uncontrolled input value state
 *  7. Compact input with automatic width adjustment
 *  8. onRemove handler for removing the input field
 *  9. Sticky placeholder that persists as user enters text
 *  10. todo: improvement - Floating Label style
 */
export function InputNative ({className, error, loading, ...props}) {
  const viewProps = extractProps(props, {childBefore: false, childAfter: false})
  let {
    active, compact, disabled, readonly,
    childBefore, childAfter, id, icon, iconEnd, input, label, prefix, suffix, self,
  } = useInputSetup(props)

  // Password visibility toggle --------------------------------------------------------------------
  if (props.type === 'password') {
    const {visible} = self.state
    if (visible) input.type = 'text'
    if (props.iconEnd == null && props.onRemove == null) {
      if (!self.toggleVisibility) self.toggleVisibility = function () {
        self.setState({visible: !self.state.visible})
      }
      iconEnd = (
        <Label className='input__icon' htmlFor={id}>
          <Icon name={visible ? 'eye' : 'eye-blocked'} onClick={self.toggleVisibility} />
        </Label>
      )
    }
  }

  return (<>
    {label}
    <Row className={cn(className, 'input', {active, compact, disabled, readonly, loading, error})} {...viewProps}>
      {childBefore}
      {icon}
      {prefix}
      {suffix}
      <input className={cn('input__field', {iconStart: icon, iconEnd})}
             {...input} ref={self.ref} />
      {iconEnd}
      {childAfter}
    </Row>
  </>)
}

/**
 * Icon Before and After Input Renderer
 * @param {string|object|function} icon - name string, props object, or render function
 * @param {object} self - function Component instance
 * @param {object} [props]:
 *   {string} id - input id
 * @returns {JSX.Element}
 */
export function renderInputIcon (icon, self, {id} = {}) {
  return (
    <Label className='input__icon' {...id != null && {htmlFor: id}}>{(isString(icon)
        ? <Icon name={icon} />
        : (isObject(icon) ? <Icon {...icon} /> : renderProp(icon, self))
    )}</Label>
  )
}

/**
 * Input Label
 * @param {string|function|object} label - string, render function, or JSX
 * @param {object} self - function Component instance
 * @param {object} [props]:
 *   {boolean} [required] - whether input is required
 *   {string} [className]
 * @returns {JSX.Element}
 */
export function renderInputLabel (label, self, {required, className = 'input__label'} = {}) {
  return <Label className={cn(className, {required})}>{renderProp(label, self)}</Label>
}

/**
 * Common Input Behaviors Setup for all native `<input>` elements
 * @example:
 *  function MyComponent ({className, float, error, loading, ...props}) {
 *    const viewProps = extractViewProps(props)
 *    let {
 *      active, compact, disabled, readonly,
 *      childBefore, childAfter, id, icon, iconEnd, label, prefix, suffix, input, self,
 *    } = useInputSetup(props)
 *  }
 * @param {object} component props to process
 * @param {object} [enabled] - optional props config to optimize for performance
 */
export function useInputSetup ({
  type, id = useId(),
  compact, controlledValue, float, format = formatByType[type], parse = parseByType[type], normalize,
  icon, iconEnd, label, prefix, suffix, onRemove, noSpellCheck = type === 'password', stickyPlaceholder,
  childBefore, childAfter, inputRef, initialValues: _1,
  ...input // rest props should only contain `input` props
}, enabled = inputEnabledOptions) {
  input.id = id
  input.type = type
  input = toReactProps(input)
  const [self] = useInstance()
  const [value] = useInputValue(input, {controlledValue, format}, self)
  const [active, setFocus] = useState(input.autoFocus)
  const hasValue = value != null && value !== ''

  // Standard Input Event Handlers -----------------------------------------------------------------
  if (!self.props) {
    self.ref = function (node) {
      self.inputNode = node
      return assignRef.call(this, inputRef, ...arguments)
    }
    self.onChange = function (e, value = e.target.value) {
      const {normalize, onChange, name} = self.props
      if (normalize) {
        const rawValue = value
        value = normalize.call(this, value, name, self, e)
        if (e.defaultPrevented) return
        if (isEqual(value, self.state.value)) {
          const {target} = e // prevent cursor jump to the end
          if (target?.setSelectionRange) {
            const cursorPos = target.selectionStart - (rawValue?.length - value?.length)
            if (cursorPos >= 0) setTimeout(() => target.setSelectionRange(cursorPos, cursorPos), 0)
          }
          return
        }
      }
      if (onChange) onChange.call(this, e, self.getParsedValue.call(this, e, value), name, self)
      if (e.defaultPrevented) return
      self.setState({value})
    }
    self.onBlur = function (e) {
      const {onBlur, name} = self.props
      if (onBlur) onBlur.call(this, e, self.getParsedValue.call(this, e), name, self)
      if (e.defaultPrevented) return
      setFocus(false)
    }
    self.onFocus = function (e) {
      const {onFocus, name} = self.props
      if (onFocus) onFocus.call(this, e, self.getParsedValue.call(this, e), name, self)
      if (e.defaultPrevented) return
      setFocus(true)
    }
    self.onRemove = function (e) {
      const {onRemove, name} = self.props
      if (onRemove) onRemove.call(this, e, self.getParsedValue.call(this, e), name, self)
      if (e.defaultPrevented) return
      self.onChange.call(this, e, null)
    }
    self.getParsedValue = function (e, value = self.state.value) {
      const {parse, name} = self.props
      if (parse) value = parse.call(this, value, name, self, e)
      return value
    }

    // Fix for Safari/Firefox bug returning empty input value when typing invalid characters
    // Must use `onKeyPress` or equivalent that does not capture modifier keys, like `Escape`.
    // `onKeyUp` will capture `Escape`, `Shift`, and common shortcuts, which is not correct behavior.
    if (type === 'number' && __CLIENT__) self.onKeyPress = function (e) {
      const {onKeyPress} = self.props
      if (onKeyPress) onKeyPress.apply(this, arguments)
      if (e.defaultPrevented) return
      // Prevent Safari from sending empty value when there is invalid character
      if (!numericPattern().test(e.key)) e.preventDefault()
    }
    if (self.onKeyPress) input.onKeyPress = self.onKeyPress
  }
  self.props = arguments[0]

  input.onChange = self.onChange
  input.onBlur = self.onBlur
  input.onFocus = self.onFocus

  // Compact Input ---------------------------------------------------------------------------------
  if (enabled.compact) compact = useCompactStyle(compact, value, input).compact

  // Remove handler --------------------------------------------------------------------------------
  if (onRemove) iconEnd = {name: 'delete', onClick: self.onRemove}

  // Child Components ------------------------------------------------------------------------------
  if (enabled.childBefore && childBefore != null) childBefore = renderProp(childBefore, self)
  if (enabled.childAfter && childAfter != null) childAfter = renderProp(childAfter, self)

  // Label -----------------------------------------------------------------------------------------
  if (enabled.label && label != null) label = renderInputLabel(label, self, input)

  // Icon ------------------------------------------------------------------------------------------
  if (enabled.icon) {
    if (icon) icon = renderInputIcon(icon, self, {id})
    if (iconEnd) iconEnd = renderInputIcon(iconEnd, self, {id})
  }

  // Sticky Placeholder ----------------------------------------------------------------------------
  if (stickyPlaceholder) {
    const {placeholder} = input
    stickyPlaceholder = placeholder && placeholder.substring(String(value).length)
  }

  // Prefix + Suffix -------------------------------------------------------------------------------
  if (enabled.prefix && prefix != null)
    prefix = <Label className='input__prefix' htmlFor={id}>{renderProp(prefix, self, opts)}</Label>
  if (enabled.suffix && (suffix != null || stickyPlaceholder))
    suffix = hasValue && (
      <Label className={cn('input__suffix', {iconStart: icon, iconEnd})}>
        <Row>
          <Text className='invisible' aria-hidden='true'>{value}</Text>
          {stickyPlaceholder ? <Text>{stickyPlaceholder}</Text> : renderProp(suffix, self, opts)}
        </Row>
      </Label>
    )

  // Render Props ----------------------------------------------------------------------------------
  const {disabled, readOnly: readonly} = input
  if (noSpellCheck) Object.assign(input, noSpellCheckProps)

  return {
    active, compact, disabled, readonly, hasValue, value,
    childBefore, childAfter, id, icon, iconEnd, label,
    prefix, suffix, stickyPlaceholder, input, self,
  }
}

// Default formatter for Input value
export const formatByType = {
  // Unused - this logic is redundant after refactor to keep input value in state as string.
  // number: (value, name, event, {inputCache}) => {
  //   if (inputCache === void 0) return value
  //   // use the same value user typed in (`value` is the result of parseNumber),
  //   // if it equals controlled value, for use cases when user enters a number
  //   // with leading zeros after the decimal, such as 1.000
  //   return inputCache.value === value ? inputCache.valueString : value
  // },
  // Unused - this logic moved to `useInputSetup` for guaranteed output and better performance
  // [undefined]: (value) => {
  //   // The default behavior is to convert `undefined` to '',
  //   // to prevent React error related to Controlled state.
  //   // This is the same behavior from 'final-form' package.
  //   // https://final-form.org/docs/react-final-form/types/FieldProps
  //   return (value === undefined) ? '' : value
  // },
}

// Default parser for Input value
export const parseByType = {
  number: v => parseNumberLocale(v),
  // Unused - logic made redundant
  // number: (value, name, event, self) => {
  //   // Note: in Safari, if user types in a comma, onChange event only fires once with value = '',
  //   // even with valid values, like 1,000 - this is clearly a bug for input type number from Safari.
  //   // => on Safari, perform sanitization of all none numeric characters, to behave like Chrome
  //   self.inputCache = {
  //     valueString: value, // cache user typed in value for formatting later
  //     value: parseNumber(value),
  //   }
  //   return self.inputCache.value
  // },
}

// Default enabled props for Input
export const inputEnabledOptions = {
  childBefore: true, childAfter: true, compact: true, icon: true, label: true, prefix: true, suffix: true,
}

// Disabled input spell check props
export const noSpellCheckProps = {
  autoComplete: 'off',
  autoCorrect: 'off',
  autoCapitalize: 'off',
  spellCheck: false,
}

const opts = {
  preserveSpace: true,
}

InputNative.defaultProps = {
  type: 'text',
}

InputNative.propTypes = {
  // Whether to use minimal width that fits content, pass number for additional character offset
  compact: type.OneOf([type.Boolean, type.Number]),
  // Whether to lock input value when `value` prop is given
  controlledValue: type.Boolean,
  // Initial value for uncontrolled state
  defaultValue: type.Any,
  // Internal value for controlled state
  value: type.Any,
  // Handler(event, value: any, name?: string, self) on input value changes
  onChange: type.Function,
  // Handler(event, value: any, name?: string, self) on input focus
  onFocus: type.Function,
  // Handler(event, value: any, name?: string, self) on input blur
  onBlur: type.Function,
  // Handler(event, value: any, name?: string, self) on input removal.
  // `onChange` handler will fire after with `null` as value, unless event.preventDefault().
  // To let `onChange` update form instance first before removing the field,
  // use setTimeout to execute code inside `onRemove` handler.
  onRemove: type.Function,
  // Label to show before the input (or after with `reverse` true)
  label: type.NodeOrFunction,
  // Whether input is loading
  loading: type.Boolean,
  // Function(value, name?, event?, self) => string - internal value formatter for native input (UI display)
  format: type.Function,
  // Function(value, name?, event, self) => any - value parser for onChange/onBlur/onFocus handlers
  parse: type.Function,
  // Function(value, name?, event, self) => string - internal value normalizer to sanitize user input
  normalize: type.Function,
  // Prefix to show before the Input value text
  prefix: type.NodeOrFunction,
  // Suffix to show after the Input value text (value must be non-empty)
  suffix: type.NodeOrFunction,
  // Whether to persist placeholder as user enters text
  stickyPlaceholder: type.Boolean,
  // Whether to disable spell check and autocorrection
  noSpellCheck: type.Boolean,
  // Custom UI to render before input node (inside .input wrapper with focus state)
  childBefore: type.NodeOrFunction,
  // Custom UI to render after input node (inside .input wrapper with focus state)
  childAfter: type.NodeOrFunction,
  // Custom Icon name or props to render before input node
  icon: type.OneOf([type.String, type.Object, type.Boolean, type.NodeOrFunction]),
  // Custom Icon name or props to render after input node (if `onRemove` not defined)
  iconEnd: type.OneOf([type.String, type.Object, type.Boolean, type.NodeOrFunction]),
  // ...other native HTML `<input/>` props
}
