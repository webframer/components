import cn from 'classnames'
import React from 'react'
import { Button } from './Button.jsx'
import { Icon } from './Icon.jsx'
import { useInstance } from './react/hooks.js'
import Tooltip from './Tooltip.jsx'
import { type } from './types.js'
import { View } from './View.jsx'

/**
 * Dropdown Menu that collapses as three-dots Icon initially
 * Logic:
 *    - Clicking the Icon toggles Dropdown Menu open state
 *    - Uses Tooltip to render the menu.
 */
export function DropdownMenu (_props) {
  const [self, state] = useInstance({open: _props.open})
  self.props = _props
  if (self.open == null) {
    // noinspection JSValidateTypes
    self.open = !!_props.open // initial open state
    self.toggleMenu = () => self.setState({open: !self.state.open})
    self.onMountTooltip = (tooltip) => {
      const {open: setOpen, close: setClose} = tooltip

      // Sync Tooltip state with Icon
      tooltip.open = function () {
        setOpen.apply(this, arguments)
        let {prerender, open} = tooltip.state
        open = !!(prerender || open)
        if (open === self.state.open) self.toggleMenu()
      }
      tooltip.close = function () {
        setClose.apply(this, arguments)
        let {prerender, open} = tooltip.state
        open = !!(prerender || open)
        if (open === self.state.open) self.toggleMenu()
      }
    }
  }

  // Render Props ----------------------------------------------------------------------------------
  const {
    className, children, btnProps, iconProps, iconOpen, iconClose, open: _1, ...props
  } = _props
  return (
    <View className={cn(className, 'dropdown-menu')} {...props}>
      <Button {...btnProps}>
        <Icon {...iconProps} name={state.open ? iconClose : iconOpen} />
      </Button>
      <Tooltip
        embedded position='bottom' on='click' align='start' offset={0}
        onMount={self.onMountTooltip}
        open={self.open}
        children={children}
      />
    </View>
  )
}

DropdownMenu.defaultProps = {
  iconClose: 'wfl/cross-sm',
  iconOpen: 'bs/three-dots-vertical',
}

const {children, ...btnPropTypes} = Button.propTypes
const {name, ...iconPropTypes} = Icon.propTypes
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
  className: type.ClassName,
  style: type.Style,
}

export default React.memo(DropdownMenu)
