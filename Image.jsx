import { FILE, fileNameWithoutExt } from '@webframer/js'
import cn from 'classnames'
import React from 'react'
import { type } from './types'

function createImage () {
  /**
   * Image - Pure Component.
   */
  function Image ({
    name,
    path,
    className,
    ...props
  }) {
    if (props.src == null) props.src = imageSrc({name, path})
    if (props.alt == null) props.alt = fileNameWithoutExt(name)
    return <img className={cn('img', className)} {...props} />
  }

  Image.defaultProps = {
    decoding: 'async',
    loading: 'lazy',
  }
  Image.propTypes = {
    // File name (required if `src` or `alt` not defined)
    name: type.String,
    // Directory path to the file (without file name) if `src` not given
    path: type.String,
    // Optional CSS classes
    className: type.String,
    decoding: type.Enum(['auto', 'async', 'sync']),
    loading: type.Enum(['eager', 'lazy']),
  }

  return [Image]
}

export function imageSrc ({avatar, src, name = '', path = FILE.PATH_IMAGES}) {
  return avatar || src || (path + name.replace(/\s/g, '-').toLowerCase())
}

export const [Image] = createImage()
export default React.memo(Image)
