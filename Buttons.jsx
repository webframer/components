import cn from 'classnames'
import React from 'react'
import { Button } from './Button.jsx'
import Icon from './Icon.jsx'
import Text from './Text.jsx'
import { tooltipProps } from './Tooltip.jsx'
import { type } from './types.js'
import { View } from './View.jsx'

/**
 * Group of Buttons, similar to Tabs in Buttoned Style with support for Tooltips
 *
 * Note:
 *  - To have two Tooltips over a button (one for dropdown menu, another as tooltip),
 *    attach the extra tooltip to <span class="position-fill"/> inside button,
 *    this way we do not change HTML markup for buttons (to style border radius),
 *    and dropdown matches exact button position (only extra tooltip has border offset).
 *
 *  - To have nested dropdown menu buttons, use `dropdownPopup` props for `tooltip` prop
 */
export function Buttons ({items, className, vertical, children, ...props}) {
  return (
    /* add `middle` or `center` class so buttons do not take full height/width */
    <View row={!vertical} className={cn(className, '_buttons', {vertical})} {...props}>
      {items.map(({icon, children, tooltipInner, active, className, ...btn}, i) => {
        if (btn.tooltip != null && vertical) btn.tooltip = tooltipProps(btn.tooltip, {position: 'right'})
        return (
          <Button key={icon || i} className={cn(className, {active})} {...btn}>
            {icon && <Icon name={icon} />}{children}
            {tooltipInner && <Text className='position-fill' tooltip={tooltipInner} />}
          </Button>
        )
      })}
      {children}
    </View>
  )
}

Buttons.propTypes = {
  // List of each Button props
  items: type.ListOf(type.Obj({
    icon: type.String,
    children: type.Any,
    active: type.Boolean,
    tooltip: type.Tooltip,
    // second tooltip for <span/> inside each button
    tooltipInner: type.Tooltip,
    // ...other <Button/> props
  })).isRequired,
  // Whether to render Buttons vertically
  vertical: type.Boolean,
  // Extra inner content to render after buttons
  children: type.Node,
  // ...other View.jsx props
}

export default React.memo(Buttons)
