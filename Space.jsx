import cn from 'classnames'
import React from 'react'
import { View } from './View'

function createSpace () {
  /**
   * Space - Pure Component
   */
  function Space ({small, large, className, ...props}) {
    return <View
      className={cn(className, 'space' + (small ? '-small' : (large ? '-large' : '')))}
      {...props}
    />
  }

  return [Space]
}

export const [Space] = createSpace()
export default React.memo(Space)
