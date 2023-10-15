import { TIME_DURATION_INSTANT } from '@webframer/js'
import cn from 'classnames'
import React, { useEffect } from 'react'
import { Button } from './Button.js'
import { Icon } from './Icon.js'
import { useInstance } from './react/hooks.js'
import { renderProp } from './react/render.js'
import Tooltip from './Tooltip.js'
import { TooltipPropTypes, type } from './types.js'
import { View } from './View.js'

/**
 * Dropdown Menu that collapses as three-dots Icon initially
 * Logic:
 *    - Clicking the Icon toggles Dropdown Menu open state
 *    - Uses Tooltip to render the menu.
 *    - To close the Dropdown, call self.tooltip.close() method directly
 */
export function DropdownMenu ({
  className, children, btnProps, iconProps, iconOpen, iconClose, menu, open, onMount, tooltipProps, ...props
}) {
  const [self, state] = useInstance({open})
  if (!self.props) {
    // noinspection JSValidateTypes
    self.initialOpen = !!open // initial open state
    self.onMountTooltip = (tooltip) => self.tooltip = tooltip
    self.onOpenTooltip = () => self.setState({open: true})
    self.onCloseTooltip = () => self.setState({open: false})
  }
  self.props = arguments[0]
  self.open = open = state.open // for render pops
  useEffect(() => {
    const {onMount} = self.props
    if (onMount) onMount(self)
  }, [])

  return (
    <View className={cn(className, 'dropdown-menu', {open})} {...props}>
      {menu
        ? renderProp(menu, self)
        : (
          <Button {...btnProps}>
            <Icon {...iconProps} name={open ? iconClose : iconOpen} />
          </Button>
        )
      }
      <Tooltip
        embedded position='bottom' on='click' align='start' offset={0} delay={TIME_DURATION_INSTANT}
        className='p-0 after:hidden'
        tooltipClass='!p-0'
        {...tooltipProps}
        onMount={self.onMountTooltip}
        open={self.initialOpen}
        onOpen={self.onOpenTooltip}
        onClose={self.onCloseTooltip}
        children={children}
      />
    </View>
  )
}

DropdownMenu.defaultProps = {
  iconClose: 'cross-sm',
  iconOpen: 'more',
}

const {children, ...btnPropTypes} = Button.propTypes
const {name, ...iconPropTypes} = Icon.propTypes
const {children: _1, ...tooltipPropTypes} = TooltipPropTypes
DropdownMenu.propTypes = {
  // Dropdown Menu content to render when open
  children: type.NodeOrFunction.isRequired,
  // Whether to open the Dropdown Menu initially
  open: type.Boolean,
  // Three-dots Button props
  btnProps: type.Obj(btnPropTypes),
  // Three-dots Button Icon props
  iconProps: type.Obj(iconPropTypes),
  iconOpen: type.Icon,
  iconClose: type.Icon,
  // Function({open: boolean, initialOpen: boolean, props, state}) => JSX - custom Menu renderer
  menu: type.NodeOrFunction,
  // Dropdown Tooltip props
  tooltipProps: type.Obj(tooltipPropTypes),
  // Handler(self: object) when this component has mounted
  onMount: type.Function,
  className: type.ClassName,
  style: type.Style,
}

export default React.memo(DropdownMenu)
