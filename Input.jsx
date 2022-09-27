import cn from 'classnames'
import React, { useId } from 'react'
import { InputNative } from './InputNative.jsx'
import { useExpandCollapse } from './react.js'
import { renderProp } from './react/render.js'
import { Select } from './Select.jsx'
import { Switch } from './Switch.jsx'
import Text from './Text.jsx'
import { type } from './types.js'
import { Upload } from './Upload.jsx'
import { UploadGrid } from './UploadGrid.jsx'
import { View } from './View.jsx'

/**
 * Universal Input Component that delegates to the corresponding component based on given `type`.
 * Features:
 *  - Error node added below delegated component
 *  - Tooltip support since this wrapper does not have overflow: hidden.
 *
 * Notes:
 *  - To avoid complicated logic, Input can accept `error` node, but not `info`.
 *    User can always use `tooltip` prop to display additional input information,
 *    or simply use another View node below tooltip.
 */
export function Input ({
  error, id = useId(), idHelp = `${id}-help`,
  className, style, tooltip, _ref,
  ...props
}) {
  const [state, _on, ref] = useExpandCollapse(error != null)

  // Accessibility ---------------------------------------------------------------------------------
  props.id = id
  props.error = error
  props['aria-describedby'] = idHelp

  return (
    <View className={cn(className, 'input-group', {error})} {...{style, tooltip, _ref}}>
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
          default:
            return <InputNative {...props} />
        }
      })()}
      <View id={idHelp} className='input__help' _ref={ref}>
        {error != null && <Text className='input__error'>{renderProp(error)}</Text>}
      </View>
    </View>
  )
}

Input.defaultProps = {
  type: 'text',
}

Input.propTypes = {
  // Unique identifier, default is string created from React.useId()
  id: type.String,
  // Initial value for uncontrolled state
  defaultValue: type.Any,
  // Label to show before the Input (or after Input with `reverse` true)
  label: type.NodeOrFunction,
  // Tooltip props or value to display as tooltip on hover
  tooltip: type.NodeOrFunction,
  // Input onChange callback(value: any, name: string, event: Event)
  onChange: type.Function,
  // Internal value for controlled state
  value: type.Any,
  // Other native HTML `<input/>` props
}

export default React.memo(Input)
