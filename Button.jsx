import cn from 'classnames'
import React from 'react'
import Loading from './Loading.jsx'
import { onPressHoc } from './react.js'
import { type } from './types.js'

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
 * @returns {Object} - React component
 */
export function Button ({
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
}) {

  return (
    <button
      className={cn(className, 'btn', size, {circle, square, active, loading})}
      disabled={disabled || loading}
      onClick={sound ? onPressHoc(onClick, sound) : onClick}
      {...props}
    >
      {children}
      {loading && <Loading loading />}
    </button>
  )
}

Button.propTypes = {
  type: type.String,
  className: type.String,
  children: type.Any,
}

export default React.memo(Button)
