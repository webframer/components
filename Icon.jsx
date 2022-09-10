import { alphaNumIdPattern, FILE } from '@webframer/js'
import cn from 'classnames'
import React from 'react'
import { accessibilitySupport, isRef } from './react.js'
import { type } from './types.js'

function createIcon () {
  /**
   * Icon - Pure Component
   */
  function Icon ({name, className, font, path = FILE.PATH_ICONS, _ref, children, ...props}, ref) {
    props = accessibilitySupport(props) // ensures correct focus behavior on click
    if (isRef(ref)) props.ref = ref
    else if (_ref) props.ref = _ref

    let mask
    if (!font) {
      mask = `url(${path}${name.replace(/\s/g, '-').replace(alphaNumIdPattern, '')
        .toLowerCase()}.svg) no-repeat center / contain`
      mask = {WebkitMask: mask, mask}
    }

    return (
      <i className={cn(`icon-${name}`, className, {pointer: props.onClick})}
         aria-hidden='true' {...props}>
        {mask && <span className='icon__mask' style={mask} />}
        {children}
      </i>
    )
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
