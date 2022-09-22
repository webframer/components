import { closestDivisor } from '@webframer/js'
import cn from 'classnames'
import React from 'react'
import Loader from './Loader.jsx'
import { Row } from './Row.jsx'
import { type } from './types.js'
import { Upload } from './Upload.jsx'
import { View } from './View.jsx'

/**
 * Multiple Files Uploader in Grid Layout with optional File preview.
 *
 * Differences from Upload.jsx component:
 *  - Accepts `initialValues` as `FileInput[]` to sync with backend schema and `final-form`
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
  count, maxColumns, gap,
  className, style, _ref, title, loading,
  ...props
}) {

  const slots = Array(count).fill({})

  // UI Props --------------------------------------------------------------------------------------
  const multiple = props.multiple = count > 1 // override multiple behavior
  if (!maxColumns) maxColumns = multiple ? closestDivisor(count, Math.sqrt(count)) : count
  const styleSlot = multiple ? {
    minWidth: 'min-content',
    maxWidth: `calc((100% - ${maxColumns - 1} * ${toCSSValue(gap)}) / ${maxColumns})`,
  } : obj
  if (multiple) style = {...style, gap: toCSSValue(gap)}

  return ( // The desired 'square' effect is for individual slots, UploadGrid itself can be any size
    <Row className={cn(className, 'upload-grid', {})} {...{style, _ref}}>
      {slots.map((slot, i) => (
        <View key={slot.i || i} className='upload-grid__item' style={styleSlot}>
          <Upload {...props} />
        </View>
      ))}
      {loading && <Loader loading={loading} size='small' />}
    </Row>
  )
}

UploadGrid.defaultProps = {
  count: 1,
  gap: '1em',
}

UploadGrid.propTypes = {
  // Upload grid count
  count: type.Number,
  // Maximum number of grid columns, default is the divisor of `count` closest to its square root
  maxColumns: type.Number,
  // Spacing between grid slots, can be any CSS value, required if count > 1
  gap: type.CSSValue,
  // Whether to disable uploaded file(s) preview (aka images, video, etc.)
  noPreview: type.Boolean,
  // Custom function preview(fileInput, i, this) or node to render for uploaded file slot
  preview: type.NodeOrFunction,
  // Whether to add 'squared' CSS class to make the dropzone fill available space as square
  square: type.Boolean,
}

export default React.memo(UploadGrid)

const obj = {}
function toCSSValue (v) {
  if (typeof v === 'number') return v + 'px'
  return v
}
