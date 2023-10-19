import { shortNumber } from '@webframer/js'
import cn from 'classnames'
import React from 'react'
import { type } from '../types.js'

function createBadge () {
  /**
   * Badge Counter Component
   */
  function Badge ({
    count,
    maxDigits,
    className,
    ...props
  }) {
    const counter = (maxDigits && count > 9) ? shortNumber(count, maxDigits) : count
    return counter ? <span className={cn(className, 'badge')} {...props}>{counter}</span> : null
  }

  Badge.propTypes = {
    // Badge count
    count: type.Number.isRequired,
    // Maximum number of count digits to display
    maxDigits: type.Number,
  }

  Badge.defaultProps = {
    maxDigits: 2,
  }

  return [Badge]
}

export const [Badge] = createBadge()
export default React.memo(Badge)
