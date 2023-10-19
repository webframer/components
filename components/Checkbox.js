import cn from 'classnames'
import React, { Fragment, useId } from 'react'
import { type } from '../types.js'
import Label from './Label.js'
import { Row } from './Row.js'
import Text from './Text.js'
import View from './View.js'

/**
 * Checkbox Input Component.
 */
export function Checkbox ({
  value, valueTrue, valueFalse, defaultValue,
  label, labelTrue = (label != null ? label : valueTrue), labelFalse = (label != null ? label : valueFalse),
  id = useId(),
  onChange, type, title, readonly, danger, className,
  float: _0, // not used
  initialValues: _1, // not used
  ...props
}) {
  if (readonly) props.readOnly = readonly // React wants `readonly` to be `readOnly`
  if (value === valueTrue) value = true
  if (value === valueFalse) value = false
  if (value == null) {
    if (defaultValue != null) props.defaultChecked = !!defaultValue
  } else {
    props.checked = !!value
  }
  if (!readonly) props.onChange = (event) => onChange(
    event, event.target.checked ? valueTrue : valueFalse, props.name,
  )
  const toggle = type === 'toggle'
  return (
    <Row className={cn('checkbox', className, {toggle})}>
      <input id={id} type='checkbox' {...props} />
      <Label htmlFor={id} title={title} className={cn('row middle justify', {danger})}>
        {toggle
          ? <Fragment>
            <Text className='checkbox__true row'>{labelTrue}</Text>
            <View className='checkbox__button' />
            <Text className='checkbox__false row'>{labelFalse}</Text>
          </Fragment>
          : (label || id)
        }
      </Label>
    </Row>
  )
}

Checkbox.propTypes = {
  // Input type
  type: type.Enum(['toggle', 'checkbox']),
  // Unique identifier, default is string created from React.useId()
  id: type.String,
  // Text to use for type='checkbox', uses `id` if not given
  label: type.String,
  // UI to show for checked state of type='toggle'
  labelTrue: type.Node,
  // UI to show for unchecked state of type='toggle'
  labelFalse: type.Node,
  // Input onChange callback(checked: boolean, name: string, event: Event)
  onChange: type.Function,
  // Internal value for controlled checked or unchecked state
  value: type.Any,
  // Internal value to assign to checked case
  valueTrue: type.Any,
  // Internal value to assign to unchecked case
  valueFalse: type.Any,
  // Initial value for uncontrolled checked or unchecked state
  defaultValue: type.Any,
  // Whether Label for unchecked state should have 'danger' CSS class
  danger: type.Boolean,
  // Whether to disable toggling state
  readonly: type.Boolean,
}

Checkbox.defaultProps = {
  type: 'checkbox',
  valueTrue: true,
  valueFalse: false,
}
export default React.memo(Checkbox)
