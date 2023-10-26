import { FILE, fileNameWithoutExt } from '@webframer/js'
import cn from 'classnames'
import React from 'react'
import { accessibilitySupport, isRef } from '../react.js'
import { type } from '../types.js'

function createImage () {
  /**
   * Image - Pure Component
   */
  function Image ({
    name,
    dir,
    className,
    _ref,
    ...props
  }, ref) {
    props = accessibilitySupport(props)
    if (isRef(ref)) props.ref = ref
    else if (_ref) props.ref = _ref

    if (props.src == null) props.src = imageSrc({name, dir})
    if (props.alt == null) props.alt = fileNameWithoutExt(name)

    return <img className={cn('img', className)} {...props} />
  }

  const ImageRef = React.forwardRef(Image)

  Image.defaultProps = {
    // Placeholder image to prevent error and for better UX
    name: 'image.svg',
    loading: 'lazy',
    decoding: 'async',
  }

  Image.propTypes = {
    // File name (required if `src` or `alt` not defined)
    name: type.Src,
    // Directory path to the file (without file name) if `src` not given
    dir: type.String,
    // Image file source URL or full file path (takes priority over file `name`)
    src: type.Src,
    // Alternative text description of the image (auto generated from file `name`)
    alt: type.String,
    loading: type.Enum(['eager', 'lazy']),
    decoding: type.Enum(['auto', 'async', 'sync']),
    className: type.ClassName,
    style: type.Style,
  }

  ImageRef.propTypes = Image.propTypes
  ImageRef.defaultProps = Image.defaultProps
  return [Image, ImageRef]
}

export function imageSrc ({avatar, src, name = '', dir = FILE.PATH_IMAGES}) {
  return avatar || src || (dir + name.replace(/\s/g, '-').toLowerCase())
}

export const [Image, ImageRef] = createImage()
const ImageMemo = React.memo(Image)
ImageMemo.name = Image.name
ImageMemo.propTypes = Image.propTypes
export default ImageMemo
