import { FILE, fileNameWithoutExt } from '@webframer/js'
import cn from 'classnames'
import React from 'react'
import { accessibilitySupport, isRef } from './react.js'
import { type } from './types'

function createImage () {
  /**
   * Image - Pure Component.
   */
  function Image ({
    name,
    path,
    className,
    _ref,
    ...props
  }, ref) {
    props = accessibilitySupport(props)
    if (isRef(ref)) props.ref = ref
    else if (_ref) props.ref = _ref

    if (props.src == null) props.src = imageSrc({name, path})
    if (props.alt == null) props.alt = fileNameWithoutExt(name)

    return <img className={cn('img', className)} {...props} />
  }

  const ImageRef = React.forwardRef(Image)

  Image.defaultProps = ImageRef.defaultProps = {
    decoding: 'async',
    loading: 'lazy',
  }

  Image.propTypes = ImageRef.propTypes = {
    // Optional CSS classes
    className: type.ClassName,
    style: type.Style,
    // Alternative text description of the image
    alt: type.String,
    // File name (required if `src` or `alt` not defined)
    name: type.String,
    // Directory path to the file (without file name) if `src` not given
    path: type.String,
    // Image file source path or URL
    src: type.String,
    decoding: type.Enum(['auto', 'async', 'sync']),
    loading: type.Enum(['eager', 'lazy']),
  }

  return [Image, ImageRef]
}

export function imageSrc ({avatar, src, name = '', path = FILE.PATH_IMAGES}) {
  return avatar || src || (path + name.replace(/\s/g, '-').toLowerCase())
}

export const [Image, ImageRef] = createImage()
export default React.memo(Image)
