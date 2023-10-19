import { FILE } from '@webframer/js'
import cn from 'classnames'
import React from 'react'
import { type } from '../types.js'
import Image from './Image.js'
import { View } from './View.js'

/**
 * Image Swatch - Dumb Component
 */
export function ImageSwatch ({
  src,
  name,
  alt = name,
  small,
  large,
  className,
  children,
  ...props
}) {
  // Use <img> for SEO and lazy load performance
  // Use cached <Image/> component to reduce rendering because `src` and `alt` are unlikely to change, unlike `onClick`
  return <View className={cn(className, 'img__swatch', {small, large})} {...props}>
    <Image src={src} alt={alt} />
    {children}
  </View>
}

ImageSwatch.defaultProps = {
  name: '',
  get src () {return FILE.PATH_IMAGES + 'image.svg'},
}

ImageSwatch.propTypes = {
  /** Full Path, URL, Base64 or Preview String object of Image file */
  src: type.UrlOrBase64OrPreview.isRequired,
  small: type.Boolean,
  large: type.Boolean,
  className: type.String,
  style: type.Object,
}

export default React.memo(ImageSwatch)
