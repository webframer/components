import classNames from 'classnames'
import React from 'react'
import Spinner from './Spinner.jsx'
import Text from './Text.jsx'
import { type } from './types.js'
import View from './View.jsx'

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
export function Loading ({
  loading = true,
  size = 'larger',  // Enum
  className,
  classIcon,
  transparent = false,
  children,
  ...props
}) {
  return (loading &&
    <View className={classNames('app__loading', className, {transparent})}>
      <Spinner className={classIcon} size={size} {...props} />
      {children && <Text className='h4 blink'>{children}</Text>}
    </View>
  )
}

Loading.propTypes = {
  loading: type.Boolean,
  size: type.ListOf(type.String),
  className: type.String,
  classIcon: type.String,
}

export default React.memo(Loading)
