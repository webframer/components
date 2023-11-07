import { FILE } from '@webframer/js'
import cn from 'classnames'
import * as React from 'react'
import { accessibilitySupport, isRef } from '../react.js'
import { type } from '../types.js'

function createIcon () {
  /**
   * Icon - Pure Component.
   * @see https://webframe.app/docs/ui/components/Icon
   */
  function Icon ({name, className, font, path = FILE.PATH_ICONS, _ref, children, ...props}, ref) {
    props = accessibilitySupport(props) // ensures correct focus behavior on click
    if (isRef(ref)) props.ref = ref
    else if (_ref) props.ref = _ref

    let mask
    if (!font && name) {
      mask = `url(${path}${name}.svg) no-repeat center / contain`
      mask = {WebkitMask: mask, mask}
    }

    return (
      <i className={cn(`icon-${name}`, className, {mask, pointer: props.onClick && props.tabIndex !== -1})}
         aria-hidden='true' {...props}>{mask && <span className='icon__mask' style={mask} />}{children}</i>
    )
  }

  const IconRef = React.forwardRef(Icon)

  Icon.propTypes = {
    // Icon name, can be empty string to be styled with custom CSS
    name: type.Icon.isRequired,
    // If `true`, use Font icon, instead of CSS masked image, which is the default
    font: type.Boolean,
    className: type.ClassName,
    style: type.Style,
  }

  IconRef.propTypes = Icon.propTypes

  return [Icon, IconRef]
}

export const [Icon, IconRef] = createIcon()
const IconMemo = React.memo(Icon)
IconMemo.name = Icon.name
IconMemo.propTypes = Icon.propTypes
export default IconMemo
