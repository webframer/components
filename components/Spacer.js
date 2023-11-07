import cn from 'classnames'
import * as React from 'react'
import { accessibilitySupport } from '../react.js'
import { type } from '../types.js'

function createSpacer () {
  /**
   * Spacer - Pure Component
   * @see https://webframe.app/docs/ui/components/Spacer
   *
   * @param {{
   *    className?: string,
   *    size?: string,
   *    [p: string]: any,
   * }} p
   * @returns {JSX.Element}
   */
  function Spacer ({className, size, ...props}) {
    props = accessibilitySupport(props) // ensures correct focus behavior on click
    if (size) size = 'spacer-' + size
    return <span className={cn(className, 'spacer', size)} {...props} />
  }

  Spacer.propTypes = {
    size: type.SizeModifier,
    className: type.ClassName,
    style: type.Style,
  }

  return [Spacer]
}

export const [Spacer] = createSpacer()
const SpacerMemo = React.memo(Spacer)
SpacerMemo.name = Spacer.name
SpacerMemo.propTypes = Spacer.propTypes
SpacerMemo.defaultProps = Spacer.defaultProps
export default SpacerMemo
