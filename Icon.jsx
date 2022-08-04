import React from 'react'
import { isRef } from './react.js'
import { type } from './types.js'

function createIcon () {
  /**
   * Icon - Pure Component
   */
  function Icon (props, ref) {
    if (isRef(ref)) props.ref = ref
    return <span className='icon-tbd' {...props} />
  }

  const IconRef = React.forwardRef(Icon)

  Icon.propTypes = {
    name: type.String.isRequired,
    large: type.Boolean,
    small: type.Boolean,
    sound: type.Object,
    className: type.String,
  }

  return [Icon, IconRef]
}

export const [Icon, IconRef] = createIcon()
export default React.memo(Icon)
