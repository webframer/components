import cn from 'classnames'
import React from 'react'
import { View } from './View'

/**
 * Space - Pure Component
 */
export function Space ({small, large, className, ...props}) {
  return <View
    className={cn(className, 'space' + (small ? '-small' : (large ? '-large' : '')))}
    {...props}
  />
}

export default React.memo(Space)
