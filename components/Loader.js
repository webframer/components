import { isString } from '@webframer/js'
import cn from 'classnames'
import * as React from 'react'
import { renderProp } from '../react/render.js'
import { type } from '../types.js'
import Spinner from './Spinner.js'
import Text from './Text.js'
import { extractProps, View } from './View.js'

/**
 * Loading Overlay - Pure Component.
 * @see https://webframe.app/docs/ui/components/Loader
 */
export function Loader ({
  loading,
  size,  // Enum
  className,
  iconClass,
  transparent,
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

Loader.defaultProps = {
  loading: true,
}

Loader.propTypes = {
  // Whether to show this Component or not
  loading: type.Boolean,
  // Optional loading text or custom UI to render as loading indicator
  children: type.NodeOrFunction,
  // Loading icon size (ie. the spinner)
  size: type.SizeModifier,
  // Class name for the loading icon
  iconClass: type.ClassName,
  className: type.ClassName,
  style: type.Style,
  // ...other props to pass to Spinner
}

const LoaderMemo = React.memo(Loader)
LoaderMemo.name = Loader.name
LoaderMemo.propTypes = Loader.propTypes
export default LoaderMemo
