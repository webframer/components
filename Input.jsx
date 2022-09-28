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
import { View } from './View.jsx'

/**
 * Universal Input Component that delegates to the corresponding UI component based on given `type`.
 * Features:
 *  - Info/Error node added below delegated component
 *  - Tooltip support (since this wrapper does not have overflow: hidden).
 *
 * Notes:
 *  - To avoid complicated logic, Input will always show `info` node if given.
 *    User can always use `tooltip` prop to display additional input information on hover.
 */
export function Input ({
  compact, error, info, id = useId(), idHelp = `${id}-help`,
  fill, className, style, tooltip, _ref,
  ...props
}) {
  if (props.type === 'hidden') return <input {...{id, className, style, ref: _ref, ...props}} />

  // Error Message ---------------------------------------------------------------------------------
  const [{animating}, _on, ref] = useExpandCollapse(error != null || info != null)
  const _error = usePreviousProp(error) // for animation to collapse
  const _info = usePreviousProp(info) // for animation to collapse
  if (animating && error == null) error = _error
  if (animating && info == null) info = _info

  // Accessibility ---------------------------------------------------------------------------------
  props.id = id
  props.compact = compact
  props.error = error
  props['aria-describedby'] = idHelp
  compact = compact != null && compact !== false

  // Render Prop -----------------------------------------------------------------------------------
  const {required} = props

  return (
    <View className={cn(className, 'input-group', {compact, error, required})}
          {...{fill, style, tooltip, _ref}}>
      {(() => {
        switch (props.type) {
          case 'select':
            return <Select {...props} />
          case 'switch':
            return <Switch {...props} />
          case 'upload':
            return <Upload {...props} />
          case 'file':
            return <UploadGrid {...props} />
          case 'textarea':
            return <TextArea {...props} />
          default:
            return <InputNative {...props} />
        }
      })()}
      <View id={idHelp} className='input__help' _ref={ref}>
        {error != null && <Label className='input__error'>{renderProp(error)}</Label>}
        {info != null && <Label className='input__info'>{renderProp(info)}</Label>}
      </View>
    </View>
  )
}

Input.defaultProps = {
  type: 'text',
}

Input.propTypes = {
  // Unique input identifier, default is string created from React.useId()
  id: type.String,
  // Help information to show after the Input
  info: type.NodeOrFunction,
  // Error message to show after the Input (ex. on validation fail)
  error: type.NodeOrFunction,
  // Tooltip props or value to display as tooltip
  tooltip: type.Tooltip,
  // ...other native HTML `<input/>` props
}

export default React.memo(Input)
