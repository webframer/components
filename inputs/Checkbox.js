import cn from 'classnames'
import React from 'react'
import Loader from '../components/Loader.js'
import { Row } from '../components/Row.js'
import { extractProps } from '../components/View.js'
import { type } from '../types.js'
import { useInputSetup } from './InputNative.js'
import Label from './Label.js'

/**
 * Checkbox Input Component.
 * @see https://webframe.app/docs/ui/inputs/Checkbox
 */
export function Checkbox ({
  checkedValue, uncheckedValue,
  className, error, label, checkedLabel, uncheckedLabel, title,
  ...props
}) {
  const viewProps = extractProps(props, {childBefore: false, childAfter: false})
  let {
    active, disabled, loading, readonly, value,
    childBefore, childAfter, id, input, self,
  } = useInputSetup(props, checkboxEnabledOptions)
  const {checked} = useToggleInputSetup({checkedValue, uncheckedValue, value, input, self})

  return (
    <Row className={cn(className, 'checkbox', {active, disabled, readonly, loading, error, checked})}
         {...viewProps}>
      {childBefore}
      <input {...input} />
      {label != null && (
        <Label className='checkbox__label' title={title} {...!disabled && !readonly && {htmlFor: id}}>
          {label}
        </Label>
      )}
      {childAfter}
      {loading && <Loader loading size='smaller' />}
    </Row>
  )
}

Checkbox.defaultProps = {
  className: 'gap-smaller',
  checkedValue: true,
  uncheckedValue: false,
}

Checkbox.propTypes = {
  // Text to use for checkbox, uses `id` if not given
  label: type.String,
  // Unique identifier, default is string created from React.useId()
  id: type.String,
  // Input onChange callback(event, value: any, name?: string, self: object)
  onChange: type.Function,
  // Internal value for controlled checked or unchecked state
  value: type.Any,
  // Initial value for uncontrolled checked or unchecked state
  defaultValue: type.Any,
  // Internal value to assign to checked case
  checkedValue: type.Any,
  // Internal value to assign to unchecked case
  uncheckedValue: type.Any,
  // Whether to disable toggling state
  readonly: type.Boolean,
}

const CheckboxMemo = React.memo(Checkbox)
CheckboxMemo.name = Checkbox.name
CheckboxMemo.propTypes = Checkbox.propTypes
CheckboxMemo.defaultProps = Checkbox.defaultProps
export default CheckboxMemo

const checkboxEnabledOptions = {childBefore: true, childAfter: true}

// Extends `useInputSetup` props for checked/unchecked input
export function useToggleInputSetup ({checkedValue, uncheckedValue, value, input, self}) {
  // Event Handler ---------------------------------------------------------------------------------
  if (!self.changeChecked) self.changeChecked = function (e) {
    const value = e.target.checked ? checkedValue : uncheckedValue
    return self.onChange.call(this, e, value) // extend the base pattern
  }
  input.onChange = self.changeChecked

  // Render Prop -----------------------------------------------------------------------------------
  const checked = input.checked = value === checkedValue
  input.type = 'checkbox'
  delete input.value

  return {checked}
}
