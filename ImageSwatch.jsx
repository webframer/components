import cn from 'classnames'
import React from 'react'
import Image from './Image.jsx'
import { type } from './types'
import { Col } from './Col.jsx'

/**
 * Image Swatch - Pure Component.
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
  return <Col className={cn('img__swatch', className, {small, large})} {...props}>
    <Image src={src} alt={alt} />
    {children}
  </Col>
}

ImageSwatch.defaultProps = {
  name: '',
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
