import cn from 'classnames'
import React from 'react'
import { useInputSetup } from './InputNative.jsx'
import Label from './Label.jsx'
import { renderProp } from './react/render.js'
import { Row } from './Row.jsx'
import { type } from './types.js'
import { toTextHeight, toTextHeightDebounce } from './utils/element.js'

/**
 * Wrapper for Native HTML `<textarea>`.
 * Features:
 *  - Label added before textarea
 *  - Icon at the start or end of textarea
 *  - Loading state (with spinner icon and temporarily readonly textarea)
 *  - Controlled or uncontrolled textarea value state
 *  - Compact textarea with automatic width adjustment
 *  - Resize textarea with automatic height adjustment
 *  - onRemove handler for removing the input field
 */
export function TextArea ({
  float, error, label, loading, resize,
  childBefore, childAfter, className, style, reverse,
  _ref, ..._props
}) {
  const {active, compact, disabled, readonly, icon, iconEnd, props, self} = useInputSetup(_props)

  // Autoresize height to fit content length -------------------------------------------------------
  if (!self.keyUp) self.keyUp = function (e) {
    // Must use onKeyUp because onKeyDown/onKeyPress does not register `Enter` or fire too many times
    const {onKeyUp} = self.props
    if (onKeyUp) onKeyUp.apply(this, arguments)
    if (e.defaultPrevented) return
    ((e.key === 'Enter') ? toTextHeight : toTextHeightDebounce)(e) // resize instantly for Enter
  }
  if (resize) props.onKeyUp = self.keyUp

  return (<>
    {label != null &&
      <Label className='input__label'>{renderProp(label, self)}</Label>}
    <Row className={cn(className, 'textarea', {active, compact, disabled, readonly, loading, error, resize})}
         {...{_ref, reverse, style}}>
      {childBefore != null && renderProp(childBefore, self)}
      {icon}
      <textarea className={cn('textarea__field', {iconStart: icon, iconEnd})} {...props} ref={self.ref} />
      {iconEnd}
      {childAfter != null && renderProp(childAfter, self)}
    </Row>
  </>)
}

// TextArea.defaultProps = {
// rows: 2, // default in the browser is 2
// }

TextArea.propTypes = {
  // Whether to use minimal width that fits content, pass number for additional character offset
  compact: type.OneOf([type.Boolean, type.Number]),
  // Initial value for uncontrolled state
  defaultValue: type.Any,
  // Internal value for controlled state
  value: type.Any,
  // Handler(value: any, name?: string, event: Event, self) on textarea value changes
  onChange: type.Function,
  // Handler(value: any, name?: string, event: Event, self) on textarea focus
  onFocus: type.Function,
  // Handler(value: any, name?: string, event: Event, self) on textarea blur
  onBlur: type.Function,
  // Handler(value: any, name?: string, event: Event, self) on textarea removal.
  // `onChange` handler will fire after with `null` as value, unless event.preventDefault().
  // To let `onChange` update form instance first before removing the field,
  // use setTimeout to execute code inside `onRemove` handler.
  onRemove: type.Function,
  // Label to show before the textarea (or after with `reverse` true)
  label: type.NodeOrFunction,
  // Whether textarea is loading
  loading: type.Boolean,
  // Function(value, name?, event?, self) => string - value formatter for UI display
  format: type.Function,
  // Function(value, name?, event, self) => any - Parser for internal value for onChange
  parse: type.Function,
  // Whether to automatically resize height style to fit content
  resize: type.Boolean,
  // Whether to disable spell check and autocorrection
  noSpellCheck: type.Boolean,
  // Custom UI to render before textarea node (inside .textarea wrapper with focus state)
  childBefore: type.NodeOrFunction,
  // Custom UI to render after textarea node (inside .textarea wrapper with focus state)
  childAfter: type.NodeOrFunction,
  // Custom Icon name or props to render before textarea node
  icon: type.OneOf([type.String, type.Object]),
  // Custom Icon name or props to render after textarea node (if `onRemove` not defined)
  iconEnd: type.OneOf([type.String, type.Object]),
  // ...other native HTML `<textarea/>` props
}

export default React.memo(TextArea)
