import cn from 'classnames'
import React from 'react'
import Loader from '../components/Loader.js'
import { Row } from '../components/Row.js'
import { extractProps } from '../components/View.js'
import { type } from '../types.js'
import { toTextHeight, toTextHeightDebounce } from '../utils/element.js'
import { useInputSetup } from './InputNative.js'

/**
 * Wrapper for Native HTML `<textarea>`.
 * @see https://webframe.app/docs/ui/inputs/TextArea
 *
 * Features:
 *  - Label added before textarea
 *  - Icon at the start or end of textarea
 *  - Loading state (with spinner icon and temporarily readonly textarea)
 *  - Controlled or uncontrolled textarea value state
 *  - Compact textarea with automatic width adjustment
 *  - Resize textarea with automatic height adjustment
 *  - onRemove handler for removing the input field
 */
export function TextArea ({className, error, resize, ...props}) {
  const viewProps = extractProps(props, {childBefore: false, childAfter: false})
  const {
    active, compact, disabled, loading, readonly,
    childBefore, childAfter, icon, iconEnd, input, label, self,
  } = useInputSetup(props)

  // Autoresize height to fit content length -------------------------------------------------------
  if (!self.onKeyUp) self.onKeyUp = function (e) {
    // Must use onKeyUp because onKeyDown/onKeyPress does not register `Enter` or fire too many times
    const {onKeyUp} = self.props
    if (onKeyUp) onKeyUp.apply(this, arguments)
    if (e.defaultPrevented) return
    ((e.key === 'Enter') ? toTextHeight : toTextHeightDebounce)(e) // resize instantly for Enter
  }
  if (resize) input.onKeyUp = self.onKeyUp

  return (<>
    {label}
    <Row className={cn(className, 'textarea', {active, compact, disabled, readonly, loading, error, resize})}
         {...viewProps}>
      {childBefore}
      {icon}
      <textarea className={cn('textarea__field', {iconStart: icon, iconEnd})} {...input} ref={self.ref} />
      {iconEnd}
      {childAfter}
      {loading && <Loader loading size='smaller' />}
    </Row>
  </>)
}

// TextArea.defaultProps = {
// rows: 2, // default in the browser is 2
// }

TextArea.propTypes = {
  // Whether to use minimal width that fits content, pass a number for additional character offset
  compact: type.OneOf([type.Boolean, type.Number]),
  // Initial value for uncontrolled state
  defaultValue: type.Any,
  // Internal value for controlled state
  value: type.Any,
  // Handler(event, value: any, name?: string, self) on textarea value changes
  onChange: type.Function,
  // Handler(event, value: any, name?: string, self) on textarea focus
  onFocus: type.Function,
  // Handler(event, value: any, name?: string, self) on textarea blur
  onBlur: type.Function,
  // Handler(event, value: any, name?: string, self) on textarea removal.
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

const TextAreaMemo = React.memo(TextArea)
TextAreaMemo.name = TextArea.name
TextAreaMemo.propTypes = TextArea.propTypes
TextAreaMemo.defaultProps = TextArea.defaultProps
export default TextAreaMemo
