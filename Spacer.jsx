import cn from 'classnames'
import React from 'react'
import { accessibilitySupport } from './react.js'
import { type } from './types.js'

function createSpacer () {
  /**
   * Spacer - Dumb Component
   */
  function Spacer ({className, size, ...props}) {
    props = accessibilitySupport(props) // ensures correct focus behavior on click
    if (size) size = 'spacer-' + size
    return <span className={cn(className, 'spacer', size)} {...props} />
  }

  Spacer.propTypes = {
    size: type.SizeModifier,
  }

  return [Spacer]
}

export const [Spacer] = createSpacer()
export default React.memo(Spacer)
