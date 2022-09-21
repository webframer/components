import { type } from './types.js'

/**
 * Notes:
 *    - `value` is not used, only `initialValues` are used by the wrapper UploadGrid,
 *      because if controlled `value` is used, we won't be able to collect the
 *      list of all uploaded/deleted/edited files since previous 'save' submission,
 *      since form input `value` will always be in sync with the current component state.
 *    - `defaultValue` is also not used, because it can be shown as preview instead.
 */
export function UploadGrid () {

}

UploadGrid.propTypes = {
  // Whether to disable uploaded file(s) preview (aka images, video, etc.)
  noPreview: type.Boolean,
}
