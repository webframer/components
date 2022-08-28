import cn from 'classnames'
import React from 'react'
import './spacer.css'
import { type } from './types.js'

function createSpacer () {
  /**
   * Spacer - Dumb Component
   */
  function Spacer ({small, smaller, smallest, large, larger, largest, className, ...props}) {
    let size = cn({small, smaller, smallest, large, larger, largest})
    if (size) size = '-' + size
    return <span className={cn(className, 'spacer' + size)} {...props} />
  }

  Spacer.propTypes = {
    small: type.Boolean,
    smaller: type.Boolean,
    smallest: type.Boolean,
    large: type.Boolean,
    larger: type.Boolean,
    largest: type.Boolean,
  }

  return [Spacer]
}

export const [Spacer] = createSpacer()
export default React.memo(Spacer)
