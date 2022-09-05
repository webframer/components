import { alphaNumIdPattern, FILE } from '@webframer/js'
import cn from 'classnames'
import React from 'react'
import { isRef } from './react.js'
import { type } from './types.js'

function createIcon () {
  /**
   * Icon - Pure Component
   */
  function Icon ({name, className, font, path = FILE.PATH_ICONS, _ref, ...props}, ref) {
    if (isRef(ref)) props.ref = ref
    else if (_ref) props.ref = _ref

    if (!font) {
      name = name.replace(/\s/g, '-').replace(alphaNumIdPattern, '').toLowerCase()
      const mask = `url(${path}${name}.svg) no-repeat center / contain`
      props.style = {...props.style, WebkitMask: mask, mask}
    }

    return <i className={cn(`icon-${name}`, className)} {...props} />
  }

  const IconRef = React.forwardRef(Icon)

  Icon.propTypes = IconRef.propTypes = {
    name: type.String.isRequired,
    // If true, use Font Icon, instead of CSS Mask Icon - the default
    font: type.Boolean,
    large: type.Boolean,
    small: type.Boolean,
    sound: type.Object,
    className: type.String,
  }

  return [Icon, IconRef]
}

export const [Icon, IconRef] = createIcon()
export default React.memo(Icon)
