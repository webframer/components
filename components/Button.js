import cn from 'classnames'
import * as React from 'react'
import { onPressHoc } from '../react.js'
import { renderProp } from '../react/render.js'
import { type } from '../types.js'
import Loader from './Loader.js'
import { useTooltip } from './Tooltip.js'

// Wrapper HOC is needed because some IDE, like Webstorm confuses Button
// with other object and autocompletes with incorrect props. Possibly because of ref
function createButton () {
  /**
   * Button - Pure Component.
   * @see https://webframe.app/docs/ui/components/Button
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
        {loading && <Loader loading size={size || 'smaller'} />}
        {tooltip}
      </button>
    )
  }

  Button.propTypes = {
    // Button content
    children: type.NodeOrFunction.isRequired,
    className: type.ClassName,
    style: type.Style,
    // Whether to add `active` css class
    active: type.Boolean,
    // Whether the button is disabled
    disabled: type.Boolean,
    // Whether to show loading state
    loading: type.Boolean,
    // Button type
    type: type.Enum(['button', 'submit']),
    tooltip: type.Tooltip,
    _ref: type.Ref,
  }

  return [Button]
}

export const [Button] = createButton()
const ButtonMemo = React.memo(Button)
ButtonMemo.name = Button.name
ButtonMemo.propTypes = Button.propTypes
export default ButtonMemo
