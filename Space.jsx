import cn from 'classnames'
import React from 'react'
import { type } from './types.js'

function createSpace () {
  /**
   * Space - Pure Component
   */
  function Space ({small, smaller, smallest, large, larger, largest, className, ...props}) {
    let size = cn({small, smaller, smallest, large, larger, largest})
    if (size) size = '-' + size
    return <span className={cn(className, 'space' + size)} {...props} />
  }

  Space.propTypes = {
    small: type.Boolean,
    smaller: type.Boolean,
    smallest: type.Boolean,
    large: type.Boolean,
    larger: type.Boolean,
    largest: type.Boolean,
  }

  return [Space]
}

export const [Space] = createSpace()
export default React.memo(Space)
