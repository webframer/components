import cn from 'classnames'
import React, { useId, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import Label from './Label.jsx'
import { useExpandCollapse } from './react.js'
import { resolveChildren } from './react/render.js'
import { Row } from './Row.jsx'
import Spacer from './Spacer.jsx'
import { type } from './types.js'

/**
 * Switch (Toggle) Input Component
 */
export function Switch ({
  value, defaultValue, checkedValue, uncheckedValue, label, checkedLabel, uncheckedLabel,
  id = useId(), onChange, title, readonly, danger, className, style, reverse,
  float: _0, // not used
  initialValues: _1, // not used
  ...props
}) {
  const {current: self} = useRef({onChange})
  if (readonly) props.readOnly = readonly // React wants `readonly` to be `readOnly`
  if (value === checkedValue) value = true
  if (value === uncheckedValue) value = false
  if (value == null) { // Uncontrolled component
    if (defaultValue != null) props.defaultChecked = !!defaultValue
  } else {  // Controlled component
    props.checked = !!value
  }
  let {checked = props.defaultChecked} = props
  const [checkedState, setChecked] = useState(!!checked)
  if (value == null) checked = checkedState // use state if uncontrolled value

  // Event Handler ---------------------------------------------------------------------------------
  if (!self.change) self.change = function (e) {
    const {checked} = e.target
    setChecked(checked)
    if (self.onChange)
      self.onChange.call(this, checked ? checkedValue : uncheckedValue, props.name, ...arguments)
  }
  props.onChange = self.change

  return (
    <Row className={cn(className, 'switch', {checked, reverse, danger})} style={style}>
      {label && <>
        <Label className='switch__label'>{resolveChildren(label, self)}</Label>
        <Spacer />
      </>}
      <input id={id} className='sr-only' {...props} />
      <Label className='switch__toggle' title={title} {...!props.readOnly && {htmlFor: id}}>
        <SwitchLabels {...{checked, checkedLabel, uncheckedLabel, self}} />
      </Label>
    </Row>
  )
}

function ToggleLabels ({checked, checkedLabel, uncheckedLabel, self}) {
  const [{open: oOn, animating: aOn}, _on, on] = useExpandCollapse(checked, {side: 'width'})
  const [{open: oOff, animating: aOff}, _off, off] = useExpandCollapse(!checked, {side: 'width'})
  return <>
    <div className={cn('switch__on', {open: oOn || aOn})} ref={on}
         children={(oOn || aOn) && (checkedLabel == null
           ? <Icon className='fade-in' name='checkmark' font />
           : resolveChildren(checkedLabel, self))} />
    <div className='switch__btn' />
    <div className={cn('switch__off', {open: oOff || aOff})} ref={off}
         children={(oOff || aOff) && (uncheckedLabel == null
           ? <Spacer />
           : resolveChildren(uncheckedLabel, self))} />
  </>
}

const SwitchLabels = React.memo(ToggleLabels)

Switch.defaultProps = {
  type: 'checkbox',
  checkedValue: true,
  uncheckedValue: false,
}

Switch.propTypes = {
  // Unique identifier, default is string created from React.useId()
  id: type.String,
  // Initial value for uncontrolled checked or unchecked state
  defaultValue: type.Any,
  // Label to show before the switch (or after Switch with `reverse` true)
  label: type.NodeOrFunction,
  // UI to show for checked state inside the Switch, defaults to a checkmark icon
  checkedLabel: type.NodeOrFunction,
  // Internal value to assign to checked case
  checkedValue: type.Any,
  // UI to show for unchecked state inside the Switch, defaults to empty Spacer
  uncheckedLabel: type.NodeOrFunction,
  // Internal value to assign to unchecked case
  uncheckedValue: type.Any,
  // Input onChange callback(checked: boolean, name: string, event: Event)
  onChange: type.Function,
  // Internal value for controlled checked or unchecked state
  value: type.Any,
  // Whether Label for unchecked state should have 'danger' CSS class
  danger: type.Boolean,
  // Other input props
}

export default React.memo(Switch)
