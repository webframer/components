import cn from 'classnames'
import React, { useId } from 'react'
import Icon from './Icon.jsx'
import { Label } from './Label.jsx'
import Loader from './Loader.jsx'
import { assignRef, toReactProps, useInstance } from './react.js'
import { resolveChildren } from './react/render.js'
import { type } from './types.js'
import { hitNodeFrom } from './utils/element.js'
import { View } from './View.jsx'

// todo:
//    - Error messages down the bottom like typical validation style (i.e. provide callback onError)
//

/**
 * Notes:
 *    - Error messages is to be displayed by the generic Input wrapper with label and info,
 *      this component only provide specific behaviors related to file upload with onError callback.
 *    - disabled inputs cannot have focus and cannot open file dialog by default.
 *    - readonly input of type file still allows opening the dialog onClick and Enter/Space press.
 *      => this behavior needs to be disabled, without setting `disabled`
 *         because the form will not submit disabled inputs.
 */
export function Upload ({
  maxFiles, maxSize, minSize, noPreview,
  inputClass, inputStyle, className, style, fill, children, squared,
  _ref, inputRef, id = useId(), title, loading,
  ...props
}) {
  let [self, {active}] = useInstance()
  props = toReactProps(props)

  // Node Handlers ---------------------------------------------------------------------------------
  if (!self.ref) {
    self.ref = (node) => (self.node = node) && assignRef(_ref, node)
    self.refInput = (node) => (self.inputNode = node) && assignRef(inputRef, node)
    self.drop = function (e) {
      if (!hasDragFiles(e)) {
        self.setState({active: false})
        return
      }

      console.warn('drop', arguments)
      self.inputNode.click()
    }
    self.dragEnter = function (e) {
      if (e.dataTransfer && !self.state.active) self.setState({active: true})
    }
    self.dragLeave = function (e) {
      if (!self.state.active) return
      // Drag leave may happen when the cursor is over the inner input, icon, or other elements.
      // only consider drag leave when the pointer does not hit any nested child elements.
      let hitNode = hitNodeFrom(e)
      while (hitNode.parentElement) {
        if (hitNode === self.node) return
        hitNode = hitNode.parentElement
      }
      self.setState({active: false})
    }
  }

  // Normalize Input behaviors ---------------------------------------------------------------------
  // Enter and Space press while focused calls onClick, so disabling onClick event is enough
  if (props.readOnly || loading) props.onClick = noop
  if (props.readOnly || props.disabled) active = false

  return (
    <View className={cn(className, 'upload', {active, loading, squared})} {...{style}}
          onDrop={self.drop} onDragEnter={self.dragEnter} onDragLeave={self.dragLeave}
          _ref={self.ref}>
      <input id={id} className={cn(inputClass, 'upload__input')} style={inputStyle} {...props}
             ref={self.refInput} />
      <Label className='upload__label' title={title} {...!props.readOnly && {htmlFor: id}}>
        {children != null ? resolveChildren(children, self) : (
          <Icon className='upload__icon' name='download' />
        )}
      </Label>
      <Loader loading={loading} size='small' />
    </View>
  )
}

Upload.defaultProps = {
  type: 'file',
  loading: false,
}

Upload.propTypes = {
  // Whether to disable uploaded file(s) preview (aka images, video, etc.)
  noPreview: type.Boolean,
  // Maximum number of uploaded files (when `multiple` is true)
  maxFiles: type.Number,
  // Maximum file(s) upload size limit in bytes (accumulative for `multiple` uploads)
  maxSize: type.Byte,
  // Minimum file(s) upload size limit in bytes (accumulative for `multiple` uploads)
  minSize: type.Byte,
  // Whether to allow upload of more than one file
  multiple: type.Boolean,
  // Whether to add 'squared' CSS class to make the dropzone fill available space as square
  squared: type.Boolean,
}

export default React.memo(Upload)

function hasDragFiles (event) {
  return !!event.dataTransfer && event.dataTransfer.files.length > 0
}

function noop (e) {
  e.preventDefault()
  e.stopPropagation()
}

// Test ------------------------------------------------------------------------------------------
// const {getRootProps, getInputProps, isDragActive: active} = useDropzone({
//   onDrop: self.drop,
//   disabled, maxFiles, maxSize, minSize,
//   noDrag, noClick, noDragEventsBubbling, noKeyboard,
// })
// console.warn(getRootProps(), getInputProps())
// Test ------------------------------------------------------------------------------------------
