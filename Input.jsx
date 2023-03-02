import { dynamicImport, isObject } from '@webframer/js'
import cn from 'classnames'
import React, { useId, useState } from 'react'
import { InputNative } from './InputNative.jsx'
import Label from './Label.jsx'
import { useExpandCollapse, usePreviousProp } from './react.js'
import { renderProp } from './react/render.js'
import { type } from './types.js'
import { extractProps, View } from './View.jsx'

// Default Input `controls` map of Components by input `type` string
export const inputControls = dynamicImport({
  'checkbox': () => import(`./Checkbox.jsx`).then(({Checkbox}) => Checkbox),
  'file': () => import(`./UploadGrid.jsx`).then(({UploadGrid}) => UploadGrid),
  'select': () => import(`./Select.jsx`).then(({Select}) => Select),
  'switch': () => import(`./Switch.jsx`).then(({Switch}) => Switch),
  'textarea': () => import(`./TextArea.jsx`).then(({TextArea}) => TextArea),
  'upload': () => import(`./Upload.jsx`).then(({Upload}) => Upload),
})

/**
 * Universal Input group that wraps the corresponding Input Control component based on given `type`.
 * Features:
 *  - Info/Error node added below delegated component
 *  - Tooltip support (since this wrapper does not have overflow: hidden).
 *
 * Notes:
 *  - To avoid complicated logic, Input will always show `info` node if given.
 *    User can always use `tooltip` prop to display additional input information on hover.
 */
export function Input ({
  compact, error, info, id = useId(), idHelp = `${id}-help`, helpTransition,
  className, controls, controlProps, ...props
}) {
  const [, forceUpdate] = useState(0)
  const viewProps = extractProps(props, {children: false, reverse: false})

  // Error Message ---------------------------------------------------------------------------------
  if (helpTransition) {
    if (!isObject(helpTransition)) helpTransition = void 0
    const [{animating}, _on, ref] = useExpandCollapse(error != null || info != null, helpTransition)
    const [_error] = usePreviousProp(error) // for animation to collapse
    const [_info] = usePreviousProp(info) // for animation to collapse
    if (animating && error == null) error = _error
    if (animating && info == null) info = _info
    helpTransition = {_ref: ref}
  }

  // Load Input Control component ------------------------------------------------------------------
  let Control = (controls && controls[props.type]) || (() => {
    // Replace default browser inputs with more intuitive components,
    // Users can always reset them to native inputs via `controls` prop
    const {[props.type]: Component = InputNative} = inputControls
    return Component
  })()
  if (Control instanceof Promise) { // only frontend will have Promise
    Control.then(() => forceUpdate(Date.now()))
    Control = null // match backend return value
  }
  if (Control === null) Control = function Loading () {return <InputNative />} // use Input to minimize layout shift

  // Render Prop -----------------------------------------------------------------------------------
  props.id = id
  props.compact = compact
  props.error = error
  props['aria-describedby'] = idHelp
  compact = compact != null && compact !== false
  const {required} = props

  return (
    <View className={cn(className, 'input-group', {compact, error, required})} {...viewProps}>
      <Control {...props} {...controlProps} />
      <View id={idHelp} className='input__help' {...helpTransition}>
        {error != null && <Label className='input__error'>{renderProp(error)}</Label>}
        {info != null && <Label className='input__info'>{renderProp(info)}</Label>}
      </View>
    </View>
  )
}

Input.defaultProps = {
  type: 'text',
  helpTransition: true,
}

Input.propTypes = {
  // Unique input identifier, default is string created from React.useId()
  id: type.String,
  // Help information to show after the Input
  info: type.NodeOrFunction,
  // Error message to show after the Input (ex. on validation fail)
  error: type.NodeOrFunction,
  // Whether to enable input info/error animation transition (or expandCollapse transition options)
  helpTransition: type.OneOf([type.Boolean, type.Object]),
  // Tooltip props or value to display as tooltip
  tooltip: type.Tooltip,
  // Map of Input Control components by their `type` string to use for rendering
  controls: type.ObjectOf(type.OneOf([type.JSXElementType, type.Promise])),
  // Props to pass to Input Control component
  controlProps: type.Object,
  // ...other native HTML `<input/>` props
}

export default React.memo(Input)
