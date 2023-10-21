import { isString } from '@webframer/js'
import cn from 'classnames'
import React from 'react'
import { renderProp } from '../react/render.js'
import { type } from '../types.js'
import Spinner from './Spinner.js'
import Text from './Text.js'
import { extractProps, View } from './View.js'

/**
 * Loading Overlay - Pure Component
 */
export function Loader ({
  loading = true,
  size,  // Enum
  className,
  iconClass,
  transparent = false,
  children,
  ...props
}) {
  return (loading &&
    <View className={cn(className, 'loader', {transparent})} {...extractProps(props)}>
      <Spinner className={iconClass} size={size} {...props} />
      {children != null && (isString(children)
          ? <Text className='h4 padding padding-top-smaller animate-blink'>{children}</Text>
          : renderProp(children)
      )}
    </View>
  )
}

Loader.propTypes = {
  // Whether to show this Component or not
  loading: type.Boolean,
  // Spinner size
  size: type.SizeModifier,
  className: type.ClassName,
  iconClass: type.ClassName,
  // ...other props to pass to Spinner
}

const LoaderMemo = React.memo(Loader)
LoaderMemo.name = Loader.name
LoaderMemo.propTypes = Loader.propTypes
export default LoaderMemo
