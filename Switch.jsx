import cn from 'classnames'
import React from 'react'
import checkbox from './Checkbox.jsx'
import Icon from './Icon.jsx'
import { useInputSetup } from './InputNative.jsx'
import Label from './Label.jsx'
import { useExpandCollapse } from './react.js'
import { renderProp } from './react/render.js'
import { Row } from './Row.jsx'
import Spacer from './Spacer.jsx'
import { type } from './types.js'
import { extractProps } from './View.jsx'

/**
 * Switch (Toggle) Input Component
 */
export function Switch ({
  className, error, loading, label, checkedLabel, uncheckedLabel, title,
  ..._props
}) {
  const viewProps = extractProps(_props)
  const {
    active, disabled, readonly, value,
    childBefore, childAfter, id, props, self,
  } = useInputSetup(_props, switchEnabledOptions)

  // Event Handler ---------------------------------------------------------------------------------
  if (!self.changeChecked) self.changeChecked = function (e) {
    return self.onChange.call(this, e, e.target.checked) // extend the base pattern
  }
  props.onChange = self.changeChecked

  // Render Prop -----------------------------------------------------------------------------------
  const checked = props.checked = value
  props.type = 'checkbox'
  delete props.value

  return (
    <Row className={cn(className, 'switch', {active, disabled, readonly, loading, error, checked})}
         {...viewProps}>
      {label != null && <>
        <Label className='switch__label'>{renderProp(label, self)}</Label>
        <Spacer />
      </>}
      {childBefore}
      <input className='sr-only' {...props} />
      <Label className='switch__toggle' title={title} {...!disabled && !readonly && {htmlFor: id}}>
        <SwitchLabels {...{checked, checkedLabel, uncheckedLabel, self}} />
      </Label>
      {childAfter}
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
           : renderProp(checkedLabel, self))} />
    <div className='switch__btn' />
    <div className={cn('switch__off', {open: oOff || aOff})} ref={off}
         children={(oOff || aOff) && (uncheckedLabel == null
           ? <Spacer />
           : renderProp(uncheckedLabel, self))} />
  </>
}

const SwitchLabels = React.memo(ToggleLabels)

Switch.propTypes = {
  // Unique identifier, default is string created from React.useId()
  id: type.String,
  // Whether to lock input value when `value` prop is given
  controlledValue: type.Boolean,
  // Initial value for uncontrolled checked or unchecked state
  defaultValue: type.Any,
  // Label to show before the switch (or after Switch with `reverse` true)
  label: type.NodeOrFunction,
  // Function(value, name?, event?, self) => boolean - Input value formatter for input.checked
  format: type.Function,
  // Function(value: boolean, name?, event, self) => any - value parser for onChange/onBlur/onFocus handlers
  parse: type.Function,
  // UI to show for checked state inside the Switch, defaults to a checkmark icon
  checkedLabel: type.NodeOrFunction,
  // UI to show for unchecked state inside the Switch, defaults to empty Spacer
  uncheckedLabel: type.NodeOrFunction,
  // Handler(event, value: any, name?: string, self) on input value changes
  onChange: type.Function,
  // Handler(event, value: any, name?: string, self) on input focus
  onFocus: type.Function,
  // Handler(event, value: any, name?: string, self) on input blur
  onBlur: type.Function,
  // Internal value for controlled checked or unchecked state
  value: type.Any,
  // ...other native HTML `<input/>` props
}

export default React.memo(Switch)

const switchEnabledOptions = {childBefore: true, childAfter: true}
