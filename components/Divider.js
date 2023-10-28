import cn from 'classnames'
import React from 'react'
import { type } from '../types.js'

function createDivider () {
  /**
   * Divider Line - Pure Component.
   * @see https://webframe.app/docs/ui/components/Divider
   */
  function Divider ({className, ...props}) {
    return <span className={cn(className, 'divider')} {...props} />
  }

  Divider.propTypes = {
    className: type.ClassName,
    style: type.Style,
  }

  return [Divider]
}

export const [Divider] = createDivider()
const DividerMemo = React.memo(Divider)
DividerMemo.name = Divider.name
DividerMemo.propTypes = Divider.propTypes
export default DividerMemo
