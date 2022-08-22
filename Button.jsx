import cn from 'classnames'
import React from 'react'
import Loader from './Loader.jsx'
import { isRef, onPressHoc } from './react.js'
import { useTooltip } from './Tooltip.jsx'
import { type } from './types.js'

// Wrapper HOC is needed because some IDE, like Webstorm confuses Button
// with other object and autocompletes with incorrect props. Possibly because of ref.
function createButton () {
  /**
   * Button - Pure Component.
   *
   * @param {Function} [onClick] - button click callback
   * @param {String} [size] - button size, one of ['small', 'base', 'large']
   * @param {String} [type=button] - button type eg. button, submit
   * @param {String} [className] - optional, will be prepended with `button `
   * @param {Boolean} [disabled] - optional, whether the button is disabled
   * @param {Boolean} [loading] - optional, show spinner instead of children
   * @param {Boolean} [active] - whether to add `active` css class=
   * @param {Boolean} [circle] - whether to add `circle` css class with even padding
   * @param {Boolean} [square] - whether to add `square` css class with even padding
   * @param {Object} [sound] - new Audio(URL) sound file
   * @param {*} [children] - optional, content to be wrapped inside button `<button>{children}</button>`
   * @param {*} [props] - other attributes to pass
   * @param {function|React.MutableRefObject} [ref] - forwarding React.useRef() or React.createRef()
   * @returns {object|JSX.Element} - React component
   */
  function Button ({
    onClick,
    disabled,
    loading,
    active,
    circle,
    square,
    children,
    size,
    sound,
    className,
    ...props
  }, ref) {
    const [tooltip] = useTooltip(props)
    return (
      <button
        className={cn(className, 'btn', size, {circle, square, active, loading})}
        disabled={disabled || loading}
        onClick={sound ? onPressHoc(onClick, sound) : onClick}
        {...isRef(ref) && {ref}}
        {...props}
      >
        {children}
        {loading && <Loader loading size={size || 'smallest'} />}
        {tooltip}
      </button>
    )
  }

  const ButtonRef = React.forwardRef(Button)

  Button.propTypes = {
    size: type.Enum(['largest', 'larger', 'large', 'base', 'small', 'smaller', 'smallest']),
    type: type.String,
    className: type.String,
    children: type.Any,
  }

  return [Button, ButtonRef]
}

export const [Button, ButtonRef] = createButton()
export default React.memo(Button)
