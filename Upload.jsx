import { _, ips, l, localiseTranslation, shortNumber, SIZE_KB, toListTotal } from '@webframer/js'
import cn from 'classnames'
import React, { useId } from 'react'
import Icon from './Icon.jsx'
import { Label } from './Label.jsx'
import Loader from './Loader.jsx'
import { assignRef, toReactProps, useInputValue, useInstance } from './react.js'
import { resolveChildren } from './react/render.js'
import Text from './Text.jsx'
import { type } from './types.js'
import { hitNodeFrom } from './utils/element.js'
import { View } from './View.jsx'

/**
 * todo: test - all possible 'accept' attribute variations
 * Notes:
 *  - Input of type 'file' is a special use case that should not have controlled state (see in code)
 *  - Error messages is to be displayed by the generic Input wrapper with label and info,
 *    this component only provides specific behaviors related to file upload with onError callback.
 *  - accept attribute passed to input does not guarantee correct files because users can change it
 *  - disabled inputs cannot have focus and cannot open file dialog by default.
 *  - readonly input of type file still allows opening the dialog onClick and Enter/Space press.
 *    => this behavior needs to be disabled, without setting `disabled`
 *       because the form will not submit disabled inputs.
 */
export function Upload ({
  maxFiles, maxSize, minSize, onChange, onError,
  inputClass, inputStyle, className, style, fill, children, squared,
  _ref, inputRef, id = useId(), title, loading,
  ...props
}) {
  props = toReactProps(props)
  let [self, {active}] = useInstance()
  const [value, setValue] = useInputValue(props)
  Object.assign(self, {
    maxFiles, maxSize, minSize, onChange, onError, value,
    accept: props.accept, multiple: props.multiple, name: props.name,
  })

  // Node Handlers ---------------------------------------------------------------------------------
  if (!self.ref) {
    self.ref = (node) => (self.node = node) && assignRef(_ref, node)
    self.refInput = (node) => (self.inputNode = node) && assignRef(inputRef, node)
    self.change = function (e) {
      // Change event may have zero files if user closes the dialog without selecting anything
      if (!e.target.files.length) { // reset input value to its previous state for form submission
        setInputFiles(self.inputNode, self.value || [])
        return
      }

      // Has Error - reset input value because it has already changed (either from drop or dialog)
      const files = [...e.target.files]
      if (self.validate.call(this, files, ...arguments)) {
        setInputFiles(self.inputNode, self.value || [])
        return
      }

      if (self.onChange) self.onChange.call(this, files, self.name, ...arguments)
      if (e.isDefaultPrevented()) return
      setValue(files)
    }
    self.drop = function () { // drop event will call input.onChange because it falls under it
      // However, drop event will not be called at all if multiples files dropped into single input
      if (self.state.active) self.setState({active: false})
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
    self.validate = function (files) { // Returns voids if validation passed, else error objects
      let errors = []
      if (!self.multiple && files.length > 1) errors.push({
        message: _.UPLOAD_A_SINGLE_FILE_ONLY,
      })
      if (self.maxFiles && files.length > self.maxFiles) errors.push({
        message: ips(_.UPLOAD_LIMIT_EXCEEDED__MAXIMUM_IS__count__FILES, {count: self.maxFiles}),
      })
      if (self.maxSize && toListTotal(files.map(f => f.size)) > self.maxSize) errors.push({
        message: ips(_.UPLOAD_LIMIT_EXCEEDED__MAXIMUM_IS__size_,
          {size: shortNumber(self.maxSize, 3, SIZE_KB) + 'B'}),
      })
      if (self.minSize && toListTotal(files.map(f => f.size)) < self.minSize) errors.push({
        message: ips(_.MINIMUM_UPLOAD_SIZE_IS__size_,
          {size: shortNumber(self.maxSize, 3, SIZE_KB) + 'B'}),
      })

      // File type validation
      // https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/accept
      // To avoid bugs with missing definition for all possible file extensions,
      // derive file extension from file.name in addition to MIME file.type check
      const accepts = self.accept && self.accept.toLowerCase().split(',')
        .map(type => type.trim().replace(/\*$/, '')) // remove '*' wildcard for partial match
      if (accepts) {
        for (const file of files) {
          const {name, type} = file
          if (!accepts.find(t => type.indexOf(t) > -1 || `.${name.split('.').pop().toLowerCase()}` === t))
            errors.push({
              file,
              message: ips(_.INVALID___file___FILE_FORMAT__MUST_BE_ONE_OF___ext_,
                {file: name, ext: accepts.join(', ')}),
            })
        }
      }
      if (errors.length) {
        if (self.onError) self.onError.call(this, errors, self.name, ...arguments)
        return errors
      }
    }
  }

  // Normalize Input behaviors ---------------------------------------------------------------------
  // Enter and Space press while focused calls onClick, so disabling onClick event is enough
  if (props.readOnly || loading) props.onClick = noop
  if (props.readOnly || props.disabled) active = false

  // React cannot set value for Input of type 'file' programmatically,
  // https://reactjs.org/docs/uncontrolled-components.html#the-file-input-tag,
  // but we can achieve that with DataTransfer API
  // https://stackoverflow.com/questions/5632629/how-to-change-a-file-inputs-filelist-programmatically
  // However, the best UX is to leave input uncontrolled,
  // because programmatically setting input files from initialValues means that the
  // form will resubmit unchanged input files back to the backend redundantly.
  // We only want to submit to backend newly uploaded files from the input.
  delete props.value
  delete props.defaultValue

  return (
    <View className={cn(className, 'upload', {active, loading, squared})} {...{style}}
          onDrop={self.drop} onDragEnter={self.dragEnter} onDragLeave={self.dragLeave}
          _ref={self.ref}>
      <input id={id} className={cn(inputClass, 'upload__input')} style={inputStyle} {...props}
             onChange={self.change} ref={self.refInput} />
      <Label className='upload__label' title={title} {...!props.readOnly && {htmlFor: id}}>
        {children != null ? resolveChildren(children, self) : ((value && value.length)
            ? <Text className='upload__text'>{value.map(v => v.name).join(', ')}</Text>
            : <Icon className='upload__icon' name='download' />
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
  // Native HTML Comma-separated list of one or more file types allowed for upload
  accept: type.String,
  // Whether to show loading spinner and block input interaction
  loading: type.Boolean,
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
  // Input files - if passed, becomes a controlled-like component
  value: type.ListOf(type.File),
  // Initial Input files for uncontrolled-like component
  defaultValue: type.ListOf(type.File),
  // Handler(acceptedFiles, name, event) when input value changes
  onChange: type.Function,
  // Handler({message: String, file?: File}[], name, event) when input changes and validation fails
  onError: type.Function,
}

export default React.memo(Upload)

function hasDragFiles (event) {
  return !!event.dataTransfer && event.dataTransfer.files.length > 0
}

function noop (e) {
  e.preventDefault()
  e.stopPropagation()
}

// Set Input value to given list of Files
function setInputFiles (inputNode, files) {
  const dataTransfer = new DataTransfer()
  for (const file of files)
    dataTransfer.items.add(file)
  inputNode.files = dataTransfer.files
}

localiseTranslation({
  UPLOAD_A_SINGLE_FILE_ONLY: {
    [l.ENGLISH]: `Upload a single file only`,
  },
  UPLOAD_LIMIT_EXCEEDED__MAXIMUM_IS__count__FILES: {
    [l.ENGLISH]: `Upload limit exceeded, maximum is {count} files`,
  },
  UPLOAD_LIMIT_EXCEEDED__MAXIMUM_IS__size_: {
    [l.ENGLISH]: `Upload limit exceeded, maximum is {size}`,
  },
  MINIMUM_UPLOAD_SIZE_IS__size_: {
    [l.ENGLISH]: `Minimum upload size is {size}`,
  },
  INVALID___file___FILE_FORMAT__MUST_BE_ONE_OF___ext_: {
    [l.ENGLISH]: `Invalid "{file}" file format, must be one of: {ext}`,
  },
})

// Test ------------------------------------------------------------------------------------------
// const {getRootProps, getInputProps, isDragActive: active} = useDropzone({
//   onDrop: self.drop,
//   disabled, maxFiles, maxSize, minSize,
//   noDrag, noClick, noDragEventsBubbling, noKeyboard,
// })
// console.warn(getRootProps(), getInputProps())
// Test ------------------------------------------------------------------------------------------
