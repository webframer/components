import cn from 'classnames'
import React, { useEffect } from 'react'
import { Button } from './Button.jsx'
import { Icon } from './Icon.jsx'
import { useInstance } from './react/hooks.js'
import { renderProp } from './react/render.js'
import Tooltip from './Tooltip.jsx'
import { tooltipProptypes, type } from './types.js'
import { View } from './View.jsx'

/**
 * Dropdown Menu that collapses as three-dots Icon initially
 * Logic:
 *    - Clicking the Icon toggles Dropdown Menu open state
 *    - Uses Tooltip to render the menu.
 */
export function DropdownMenu ({
  className, children, btnProps, iconProps, iconOpen, iconClose, menu, open, onMount, tooltipProps, ...props
}) {
  const [self, state] = useInstance({open})
  if (!self.props) {
    // noinspection JSValidateTypes
    self.initialOpen = !!open // initial open state
    self.toggleMenu = () => self.setState({open: !self.state.open})
    self.onMountTooltip = (tooltip) => {
      const {open: setOpen, close: setClose} = tooltip
      self.tooltip = tooltip

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
  self.props = arguments[0]
  self.open = self.state.open // for render pops
  useEffect(() => {
    const {onMount} = self.props
    if (onMount) onMount(self)
  }, [])

  return (
    <View className={cn(className, 'dropdown-menu')} {...props}>
      {menu
        ? renderProp(menu, self)
        : (
          <Button {...btnProps}>
            <Icon {...iconProps} name={state.open ? iconClose : iconOpen} />
          </Button>
        )
      }
      <Tooltip
        embedded position='bottom' on='click' align='start' offset={0}
        className='p-0 after:hidden'
        tooltipClass='!p-0'
        {...tooltipProps}
        onMount={self.onMountTooltip}
        open={self.initialOpen}
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
  tooltipProps: type.Obj(tooltipProptypes),
  // Handler(self: object) when this component has mounted
  onMount: type.Function,
  className: type.ClassName,
  style: type.Style,
}

export default React.memo(DropdownMenu)
