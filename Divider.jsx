import cn from 'classnames'
import React from 'react'

function createDivider () {
  /**
   * Divider Line - Dumb Component
   */
  function Divider ({className, ...props}) {
    return <span className={cn(className, 'divider')} {...props} />
  }

  return [Divider]
}

export const [Divider] = createDivider()
export default React.memo(Divider)
