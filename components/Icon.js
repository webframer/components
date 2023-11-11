import { FILE } from '@webframer/js'
import cn from 'classnames'
import * as React from 'react'
import { accessibilitySupport } from '../react.js'
import { type } from '../types.js'

function createIcon () {
  /**
   * Icon - Pure Component.
   * @see https://webframe.app/docs/ui/components/Icon
   */
  function Icon ({name, className, font, path = FILE.PATH_ICONS, _ref, children, ...props}) {
    props = accessibilitySupport(props) // ensures correct focus behavior on click
    if (_ref) props.ref = _ref

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

  Icon.propTypes = {
    // Icon name, can be empty string to be styled with custom CSS
    name: type.Icon.isRequired,
    // If `true`, use Font icon, instead of CSS masked image, which is the default
    font: type.Boolean,
    className: type.ClassName,
    style: type.Style,
  }

  return [Icon]
}

export const [Icon] = createIcon()
const IconMemo = React.memo(Icon)
IconMemo.name = Icon.name
IconMemo.propTypes = Icon.propTypes
export default IconMemo
