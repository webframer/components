import { _, __CLIENT__, ips, isFunction, isString, l, SIZE_KB, translate } from '@webframer/js'
import { by, hasListValue, toList } from '@webframer/js/array.js'
import { canAccept, FILE, previewSize, previewSizes } from '@webframer/js/file.js'
import { closestDivisor, shortNumber } from '@webframer/js/number.js'
import cn from 'classnames'
import React, { useEffect } from 'react'
import Image from '../components/Image.js'
import Loader from '../components/Loader.js'
import { Row } from '../components/Row.js'
import Text from '../components/Text.js'
import { View } from '../components/View.js'
import { useInstance, useSyncedState } from '../react/hooks.js'
import { type } from '../types.js'
import { Upload } from './Upload.js'

/**
 * Multiple Files Uploader in Grid Layout with optional File preview.
 * @see https://webframe.app/docs/ui/inputs/UploadGrid
 *
 * Differences from Upload.jsx component:
 *  - Accepts `initialValues` as `FileInput[]` to sync with backend schema and `final-form`.
 *  - `onChange` callback only sends changed fileInputs, not all files currently in state.
 *  - Uses Upload.jsx component internally for each upload slot.
 *  - Does not work with traditional form.submit(), because internal `value` are not File objects.
 *    Instead, use it with `final-form` submit API to send data to backend as props.
 *
 * Notes:
 *    - `value` is not used, only `initialValues` are used by UploadGrid,
 *      because if controlled `value` is used, we won't be able to collect the
 *      list of all uploaded/deleted/edited files since previous 'save' submission,
 *      since form input `value` will always be in sync with the current component state.
 *    - `defaultValue` is also not used, only `initialValues`
 */
export function UploadGrid ({
  initialValues, maxFiles, maxColumns, gap, kind, multiple: asArray,
  onChange, onChangeLast, onRemove,
  noPreview, noPreviewClean, preview, previewAccept, previewClass, slotLabel, types,
  className, style, _ref, title, loading,
  ...props
}) {
  // @Note: for file uploads, we don't want to resubmit unchanged files,
  // thus only changed values (fileInputs) are sent to backend.
  // If the form is re-initialized, then changed values should reset
  const [self] = useInstance({changedValues: {}})
  const [state, justSynced] = useSyncedState({
    fileInputs: toList(initialValues, true),
    name: props.name, // trigger reset state when input.name changes
  }, self.state)
  const {fileInputs} = self.state = state
  if (justSynced) self.state.changedValues = {} // reset changed values
  self.isExplicitType = hasListValue(types)
  self.isIncremental = !self.isExplicitType && maxFiles > 1
  if (self.isExplicitType) maxFiles = types.length
  self.props = {kind, maxFiles, onChange, onChangeLast, onRemove, asArray, name: props.name}

  // Upload Grid Slots -----------------------------------------------------------------------------
  let slots
  // explicitly defined identifiers
  if (self.isExplicitType) {
    // Sort placeholder by identifier types order, and create placeholders if not uploaded yet
    slots = types.map(({_: i, name}) => fileInputs.find(f => f.i === i) || {i, name})
  }
  // sort by incremental count
  else {
    const placeholders = fileInputs.length < maxFiles
      ? Array(maxFiles).fill(true).map((_, i) => ({i}))
        .filter(({i}) => !fileInputs.find(f => String(f.i) === String(i)))
      : []
    slots = fileInputs.concat(placeholders).sort(by('i'))
  }

  // Event Handlers --------------------------------------------------------------------------------
  if (!self.change) {
    /**
     * Handle selected Files & update internal state
     * @param {Event} e - click event object to pass to handlers
     * @param {File[]} files - objects from input type="file"
     * @param {string|number} i - identifier or index position
     */
    self.change = function (e, files, i) {
      if (!hasListValue(files)) return // we already handle this case with self.remove
      const indexBy = {}
      const {kind} = self.props
      // Cannot destruct object to preserve File object
      const changedFiles = files.map((file, index) => {  // index here is from Dropzone accepted files list
        const identifier = (self.isIncremental && index) ? (+i + index) : i // put multiple files to other grid slots
        indexBy[identifier] = true
        return ({i: identifier, kind, name: file.name, file})
      })
      const fileInputs = self.state.fileInputs.filter(f => !indexBy[f.i]).concat(changedFiles)
      self.updateFiles.call(this, e, fileInputs, changedFiles)
    }

    /**
     * Update Internal State
     * @param {Event} e - click event object to pass to handlers
     * @param {FileInput[]} fileInputs - all files in state of type.FileInput
     * @param {{i, remove, file}[]} changedFiles - list of changed files of type.FileInput
     */
    self.updateFiles = function (e, fileInputs, changedFiles) {
      const {onChange, onChangeLast, maxFiles, asArray, name} = self.props
      const {changedValues} = self.state
      const isArray = maxFiles > 1 || asArray
      changedFiles = (self.isIncremental ? changedFiles.filter(f => f.i < maxFiles) : changedFiles)
        .map(fileInput => {
          const {kind, i} = fileInput
          return changedValues[`${kind}_${i}`] = fileInput
        })
      // `i` may be undefined or NaN for single upload, and if it's numeric, no need to convert for comparison
      self.setState({
        fileInputs: self.isIncremental ? fileInputs.sort(by('i')).filter(f => f.i < maxFiles) : fileInputs,
      })
      if (onChangeLast) {
        onChangeLast.call(this, e, isArray ? changedFiles : changedFiles[0], name, self)
      } else if (onChange) {
        onChange.call(this, e, isArray ? Object.values(changedValues) : changedFiles[0], name, self)
      }
    }

    /**
     * Remove file from State
     * @param {Event} e - from Upload.onRemove
     * @param {{name}} fileInput - to remove
     * @param {function} callback - from Upload.onRemove
     */
    self.remove = function (e, fileInput, callback) {
      e.stopPropagation() // disable onClick for Dropzone
      const {asArray, maxFiles, onRemove, name} = self.props
      const isArray = maxFiles > 1 || asArray
      if (onRemove) onRemove.call(
        this, e, isArray ? [fileInput] : fileInput, name, self, () => self.removeFiles.apply(this, arguments),
      )
      if (e.defaultPrevented) return

      e.preventDefault() // disable default behavior of Upload
      if (confirm(ips(_.DO_YOU_WANT_TO_REMOVE___file___, {file: fileInput.name})))
        self.removeFiles.apply(this, arguments)
    }
    self.removeFiles = function (e, {i, kind}, callback) {
      callback.call(this) // clear Upload input value
      const fileInputs = self.state.fileInputs.filter(f => f.i !== i) // name may not be unique, using URI
      self.updateFiles.call(this, e, fileInputs, [{i, kind, remove: true}])
    }
  }

  // File Preview ----------------------------------------------------------------------------------
  const showPreview = !noPreview && previewAccept
  if (!self.previewByURL) self.previewByURL = {}
  // Generate File object or preview if it does not exist
  fileInputs.forEach((fileInput) => {
    // `file` exists for newly selected File, and gets generated for uploaded File to backend
    // to control Upload.value.
    // `src` only exists for uploaded files from backend
    //  => use it to check and add `preview` to differentiate newly selected file from uploaded `src`
    const {file, preview, src, name} = fileInput
    if (!src && !preview && file) self.previewByURL[fileInput.preview = URL.createObjectURL(file)] = true
    else if (src && !file) fileInput.file = __CLIENT__ ? (new File([], name)) : {name}
  })
  // Release unused File previews
  if (showPreview && !noPreviewClean) cleanPreviewURLs(self.previewByURL, fileInputs)
  // Cleanup resources on unmount
  useEffect(() => {
    if (!noPreviewClean) return () => cleanPreviewURLs(self.previewByURL, [])
  }, [noPreviewClean])

  // UI Props --------------------------------------------------------------------------------------
  const multiple = maxFiles > 1
  const showI = slotLabel === 'i'
  const showLabelAlways = slotLabel || showI
  const showFileName = slotLabel !== false
  if (!maxColumns) maxColumns = multiple ? closestDivisor(maxFiles, Math.sqrt(maxFiles)) : maxFiles
  const styleSlot = multiple ? {
    minWidth: 'min-content',
    maxWidth: `calc((100% - ${maxColumns - 1} * ${toCSSValue(gap)}) / ${maxColumns})`,
  } : obj
  if (multiple) style = {...style, gap: toCSSValue(gap)}
  if (loading) props.readOnly = true
  props.multiple = self.isIncremental // override multiple behavior

  return ( // The desired 'square' effect is for individual slots, UploadGrid itself can be any size
    <Row className={cn(className, 'upload-grid', {loading})} {...{style, _ref}}>
      {slots.map((fileInput, index) => {
        let {i, name, file, width, height, size} = fileInput
        if (i == null) i = index

        // File Preview
        // If File was just selected from the device, use preview as is,
        // else try to load medium size Image
        let hasPreviewType = file && showPreview && canAccept(fileInput, previewAccept)
        let filePreview = props.children // allow custom dropzone UI when no file selected
        if (isString(hasPreviewType)) {
          if (hasPreviewType.indexOf('.') === 0) hasPreviewType = FILE.MIME_TYPE_BY_EXT[hasPreviewType]
          if (hasPreviewType && hasPreviewType.indexOf('image/') === 0)
            filePreview = preview == null ? (
              <Image className={cn(previewClass, 'upload__file__preview')} alt={name}
                     src={fileInput.preview || previewSize(previewSizes(fileInput, null), 'medium')} />
            ) : (isFunction(preview) ? preview(fileInput, index, self) : preview)
        }

        // File Labels
        let fileLabel
        if (showLabelAlways) fileLabel = (showI || !file) ? (types ? types[index].name : (index + 1)) : name
        else if (showFileName && filePreview) fileLabel = name
        if (fileLabel != null) {
          fileLabel = <Text className='upload__file__label'>{fileLabel}</Text>

          // Show width/height or size if backend data has it
          let fileSize
          if (width && height) fileSize = ips(_._width__X__height_, {width, height})
          else if (size != null) fileSize = shortNumber(size, 3, SIZE_KB) + 'B'
          if (fileSize != null) {
            fileSize = <Text className='upload__file__size'>{fileSize}</Text>
            fileLabel = <>{fileLabel}{fileSize}</>
          }
        }

        return (
          <View key={i} className='upload-grid__item' style={styleSlot}>
            <Upload
              {...props}
              value={file ? [file] : []}
              maxFiles={maxFiles}
              childAfter={fileLabel}
              onChange={function (e, files) {self.change.call(this, e, files, i)}}
              onRemove={function (e, files, name, s, cb) {self.remove.call(this, e, fileInput, cb)}}
              children={filePreview}
            />
          </View>
        )
      })}
      {loading && <Loader loading={loading} size='small' />}
    </Row>
  )
}

UploadGrid.defaultProps = {
  maxFiles: 1,
  gap: '1em',
  previewAccept: 'image/*',
}

UploadGrid.propTypes = {
  // Uploaded FileInput(s) value to render initially or to sync with
  initialValues: type.OneOf([type.ListOf(type.FileInput), type.FileInput]),
  // Handler(event, fileInput(s), name, self) when file(s) change, receives all changed file(s) since initialization
  onChange: type.Function,
  // Similar to `onChange` callback, but receives only last changed file(s), will not call `onChange` if given
  onChangeLast: type.Function,
  // Handler(event, fileInput(s), name, self, callback) before input files are to be removed,
  // To use custom behavior, set event.preventDefault, then fire `callback()` yourself.
  // The default behavior uses window.confirm() before calling `onChange` to remove files.
  onRemove: type.Function,
  // Whether to get fileInput(s) as list, even if maxFiles = 1, ignored if `maxFiles > 1` or `types` is defined
  multiple: type.Boolean,
  // Number of files that can be uploaded, ignored if `types` is defined
  maxFiles: type.Number,
  // Maximum number of grid columns, default is the divisor of `maxFiles` closest to its square root
  maxColumns: type.Number,
  // Spacing between grid slots, can be any CSS value, required if maxFiles > 1
  gap: type.CSSLength,
  // Type of file (added as attribute to new FileInput uploads)
  kind: type.Any,
  // Whether to disable selected/uploaded file(s) preview (aka images, video, etc.)
  noPreview: type.Boolean,
  // Whether to disable automatic garbage clean to release memory for unused File previews
  noPreviewClean: type.Boolean,
  // Custom function preview(fileInput, index, self) or node to render for selected/uploaded file slot
  preview: type.NodeOrFunction,
  // Comma separated list of File MIME types or extensions, similar to <input accept=""/> to enable File preview
  previewAccept: type.String,
  // CSS class to add to preview node
  previewClass: type.String,
  // Whether to add 'squared' CSS class to make the dropzone fill available space as square
  square: type.Boolean,
  // Whether to always show File label, like: incremental slot count, identifier type.name, or File.name.
  // Pass `false` to disable File label (note: Upload component may still show list of files)
  // Pass `i` string to always show incremental count or type.name (if `types` given)
  // By default, File.name is shown when it has preview.
  slotLabel: type.OneOf([type.Boolean, type.Enum(['i'])]),
  // Named Identifier definitions for each upload type in the grid, default is incremental count
  types: type.ListOf(type.Definition.isRequired),
  // ...other Upload props to pass
}

const UploadGridMemo = React.memo(UploadGrid)
UploadGridMemo.name = UploadGrid.name
UploadGridMemo.propTypes = UploadGrid.propTypes
UploadGridMemo.defaultProps = UploadGrid.defaultProps
export default UploadGridMemo

// Garbage clean to release memory for unused File preview URLs
function cleanPreviewURLs (previewByURL, fileInputs) {
  for (const url in previewByURL) {
    if (fileInputs.find(f => f.preview === url)) continue
    URL.revokeObjectURL(url)
    delete previewByURL[url]
  }
}

function toCSSValue (v) {
  if (typeof v === 'number') return v + 'px'
  return v
}

const obj = {}

translate({
  _width__X__height_: {
    [l.ENGLISH]: '{width} x {height}',
  },
})
