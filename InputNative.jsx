import cn from 'classnames'
import React, { useId, useMemo, useRef, useState } from 'react'
import Label from './Label.jsx'
import { assignRef, toReactProps } from './react.js'
import { useInputValue } from './react/hooks.js'
import { renderProp } from './react/render.js'
import { Row } from './Row.jsx'
import Text from './Text.jsx'
import { type } from './types.js'
import { resizeWidth } from './utils/element.js'

/**
 * Wrapper for Native HTML Input, such as: 'text', 'number', 'email', etc. where value is text.
 * Features:
 *  - Label added before input
 *  - Handles controlled or uncontrolled input value state
 *  - Resizing rows for textarea input
 *  - Compact width calculation
 *  - Input unit prefix/suffix (ex. '$' prefix or 'USD' suffix for number input)
 */
export function InputNative ({
  onChange, onBlur, onFocus,
  compact, float, error, label, loading, prefix, suffix, id = useId(),
  _ref, ...props
}) {
  props.id = id
  props = toReactProps(props)
  const {current: self} = useRef({})
  const [value, setValue] = useInputValue(props)
  const [focus, setFocus] = useState(props.autoFocus)
  const hasValue = value != null && value !== ''
  self.props = {onChange, onBlur, onFocus, focus, value, name: props.name}

  // Event Handlers --------------------------------------------------------------------------------
  if (!self.ref) {
    self.ref = function (node) {
      self.inputNode = node
      return assignRef.call(this, _ref, ...arguments)
    }
    self.change = function (e) {
      const {value} = e.target
      const {name, onChange} = self.props
      if (onChange) onChange.call(this, value, name, ...arguments)
      if (e.defaultPrevented) return
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
  }
  props.onChange = self.change
  props.onBlur = self.blur
  props.onFocus = self.focus

  // Compact Input ---------------------------------------------------------------------------------
  const {placeholder} = props
  const styleCompact = useMemo(() => {
    if (!compact) return
    let maxContent = value == null ? '' : value
    if (placeholder && placeholder.length > maxContent.length) maxContent = placeholder
    return resizeWidth(maxContent, {}, compact)
  }, [compact, placeholder, value])

  // Render Props ----------------------------------------------------------------------------------
  const {disabled, readOnly: readonly} = props

  return (<>
    {!float && label != null &&
      <Label className='input__label' htmlFor={id}>{renderProp(label, self)}</Label>
    }
    <Row className={cn('input', {active: focus, error, disabled, readonly, loading})}>
      {prefix != null && <Label className='input__prefix' htmlFor={id}>{renderProp(prefix, self)}</Label>}
      {suffix != null && hasValue &&
        <Label className='input__suffix'>
          <Row>
            <Text className='invisible' aria-hidden='true'>{value}</Text>{renderProp(suffix, self)}
          </Row>
        </Label>
      }
      {(() => {
        switch (props.type) {
          case 'textarea':
            return <textarea {...props} />
          default:
            if (compact) props.style = {...props.style, ...styleCompact}
            return <input {...props} ref={self.ref} />
        }
      })()}
    </Row>
  </>)
}

InputNative.propTypes = {
  // Label to show before the Input (or after Input with `reverse` true)
  label: type.NodeOrFunction,
  // Prefix to show before the Input value text
  prefix: type.NodeOrFunction,
  // Suffix to show after the Input value text (value must be non-empty)
  suffix: type.NodeOrFunction,
}
