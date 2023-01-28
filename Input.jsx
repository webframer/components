import { isObject } from '@webframer/js'
import cn from 'classnames'
import React, { useId } from 'react'
import { InputNative } from './InputNative.jsx'
import Label from './Label.jsx'
import { useExpandCollapse, usePreviousProp } from './react.js'
import { renderProp } from './react/render.js'
import { Select } from './Select.jsx'
import { Switch } from './Switch.jsx'
import { TextArea } from './TextArea.jsx'
import { type } from './types.js'
import { Upload } from './Upload.jsx'
import { UploadGrid } from './UploadGrid.jsx'
import { extractProps, View } from './View.jsx'

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
  className, style, reverse, _ref,
  controls, children, controlProps, ...props
}) {
  const viewProps = extractProps(props)
  if (props.type === 'hidden') return <input {...{id, className, style, ref: _ref, ...props}} />

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

  // Render Prop -----------------------------------------------------------------------------------
  props.id = id
  props.compact = compact
  props.error = error
  props.reverse = reverse
  props['aria-describedby'] = idHelp
  if (children != null) props.children = children
  compact = compact != null && compact !== false
  const {required} = props
  const Control = (controls && controls[props.type]) || (() => {
    switch (props.type) {
      case 'select':
        return Select
      case 'switch':
        return Switch
      case 'upload':
        return Upload
      case 'file':
        return UploadGrid
      case 'textarea':
        return TextArea
      default:
        return InputNative
    }
  })()

  return (
    <View className={cn(className, 'input-group', {compact, error, required})} style={style} {...viewProps}>
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
  controls: type.ObjectOf(type.JSXElementType),
  // Props to pass to Input Control component
  controlProps: type.Object,
  // ...other native HTML `<input/>` props
}

export default React.memo(Input)
