import cn from 'classnames'
import React from 'react'
import Loader from './Loader.js'
import { onPressHoc } from './react.js'
import { renderProp } from './react/render.js'
import { useTooltip } from './Tooltip.js'
import { type } from './types.js'

// Wrapper HOC is needed because some IDE, like Webstorm confuses Button
// with other object and autocompletes with incorrect props. Possibly because of ref.
function createButton () {
  /**
   * Button - Pure Component.
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
    _ref,
    ...props
  }) {
    const [tooltip] = useTooltip(props)
    if (_ref) props.ref = _ref
    return (
      <button
        className={cn(className, 'btn', {active, loading, circle, square})}
        disabled={disabled || loading}
        onClick={sound ? onPressHoc(onClick, sound) : onClick}
        {...props}
      >
        {renderProp(children)}
        {loading && <Loader loading size={size || 'smallest'} />}
        {tooltip}
      </button>
    )
  }

  Button.propTypes = {
    children: type.NodeOrFunction.isRequired,
    className: type.ClassName,
    style: type.Style,
    // Whether to add `active` css class
    active: type.Boolean,
    // Whether the button is disabled
    disabled: type.Boolean,
    // Whether to show loading spinner
    loading: type.Boolean,
    // Button type eg. button, submit
    type: type.Enum(['button', 'submit']),
    tooltip: type.Tooltip,
    _ref: type.Ref,
  }

  return [Button]
}

export const [Button] = createButton()
export default React.memo(Button)
