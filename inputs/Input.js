import { dynamicImport, isObject } from '@webframer/js'
import cn from 'classnames'
import * as React from 'react'
import { useId, useState } from 'react'
import { extractProps, View } from '../components/View.js'
import { useExpandCollapse, usePreviousProp } from '../react.js'
import { renderProp } from '../react/render.js'
import { type } from '../types.js'
import { InputNative } from './InputNative.js'
import Label from './Label.js'

// Default Input `controls` map of Components by input `type` string
export const inputControls = dynamicImport({
  'checkbox': () => import(`./Checkbox.js`).then(({Checkbox}) => Checkbox),
  'file': () => import(`./UploadGrid.js`).then(({UploadGrid}) => UploadGrid),
  'select': () => import(`./Select.js`).then(({Select}) => Select),
  'switch': () => import(`./Switch.js`).then(({Switch}) => Switch),
  'textarea': () => import(`./TextArea.js`).then(({TextArea}) => TextArea),
  'upload': () => import(`./Upload.js`).then(({Upload}) => Upload),
})

/**
 * Universal Input group that wraps the corresponding Input Control component based on given `type`.
 * @see https://webframe.app/docs/ui/inputs/Input
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
  /**
   * Native input `type` attribute, also a key identifier for delegated input controls.
   * See [input type examples](#input-types).
   */
  type: type.String,
  // Unique input identifier, default is string created from React.useId()
  id: type.String,
  // Help information to show after the Input
  info: type.NodeOrFunction,
  // Error message to show after the Input (ex. on validation fail)
  error: type.NodeOrFunction,
  // Whether to enable input info/error animation transition (or expandCollapse transition options)
  helpTransition: type.OneOf([type.Boolean, type.Object]),
  // Whether to make input take only the minimum content width necessary
  compact: type.Boolean,
  // Map of Input Control components by their `type` string to use for rendering
  controls: type.ObjectOf(type.OneOf([type.JSXElementType, type.Promise])),
  // Props to pass to Input Control component
  controlProps: type.Object,
  tooltip: type.Tooltip,
  // ...other native HTML `<input/>` props
}

const InputMemo = React.memo(Input)
InputMemo.name = Input.name
InputMemo.propTypes = Input.propTypes
InputMemo.defaultProps = Input.defaultProps
export default InputMemo
