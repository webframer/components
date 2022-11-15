import { isString } from '@webframer/js'
import cn from 'classnames'
import React from 'react'
import { renderProp } from './react/render.js'
import Spinner from './Spinner.jsx'
import Text from './Text.jsx'
import { type } from './types.js'
import { extractViewProps, View } from './View.jsx'

/**
 * Loading Overlay - Pure Component
 *
 * @param {Boolean} [loading] - whether to show this Component or not
 * @param {String} [size] - spinner size
 * @param {String} [className] - css class to add
 * @param {String} [classIcon] - css class to add to spinner icon
 * @param {Boolean} [transparent] - whether to add 'transparent' css class
 * @param {*} [children] - optional content to render
 * @param {*} props - other attributes to pass to spinner
 * @returns {object} - React Component
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
    <View className={cn(className, 'loader', {transparent})} {...extractViewProps(props)}>
      <Spinner className={iconClass} size={size} {...props} />
      {children != null && (isString(children)
          ? <Text className='h4 padding padding-top-smaller animate-blink'>{children}</Text>
          : renderProp(children)
      )}
    </View>
  )
}

Loader.propTypes = {
  loading: type.Boolean,
  size: type.SizeModifier,
  className: type.ClassName,
  iconClass: type.ClassName,
  // ...other props to pass to Spinner
}

export default React.memo(Loader)
