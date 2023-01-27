import { debounce, TIME_DURATION_INSTANT } from '@webframer/js'
import { isPureKeyPress } from '@webframer/js/keyboard.js'
import cn from 'classnames'
import React from 'react'
import { Input } from './Input.jsx'
import { Label } from './Label.jsx'
import { useInputValue, useInstance } from './react/hooks.js'
import { renderProp } from './react/render.js'
import { type } from './types.js'
import { onEventHandler } from './utils/interaction.js'
import { View } from './View.jsx'

/**
 * Input with dynamic types that switches between Button (`btnType`) and Input (`type`) Control
 * on single/double click, and back on Blur/Enter/Escape events:
 *
 *  - `btnType` and `type` can be native or any custom input `type` defined by `controls` prop.
 *  - Button state allows dragging to reorder, and single/double click to edit Input,
 *    whereas dragging Input becomes text selection (ie. highlight text).
 *  - Button state can use any Component, not just Button, by setting `btnType`.
 *    The same goes for Input, by setting `type`.
 *  - Drag events do not fire `onClick`.
 *
 * Requirements:
 *  1. Input Control component has similar logic to `useInputValue` because `format` is removed.
 *  2. Input Control component has `value` state attached to `self.state.value` or
 *     `event.target.value` for `onBlur` and `onKeyUp` events.
 *     See `self.getStateValue` for reference.
 *
 * @example:
 * ┌──── <InputButton/> ─────┐  ┌───────── <Input/> ──────────┐
 * │                         │  │    (Universal Component)    │
 * │ Button state: btnType ─┐│  │                             │
 * │           OR           ├───┼─────> controls[type]        │
 * │ Input state:    type  ─┘│  │      ┌──────┴──────┐        │
 * │           +             │  │      ↓             ↓        │
 * │     (value cache)       │  │  <Button/>   <InputNative/> │
 * │           ↑             │  │                    │        │
 * └───────────│─────────────┘  └────────────────────│────────┘
 *             └─────────────────────────────────────┘
 * Logic:
 *    - `onChange` event only fires on Blur/Enter events from Input,
 *      => to subscribe to any Input value changes while typing, use `onInput` events
 *    - Escape key press will discard any changes made to Input, and simulate `onBlur` event.
 *    - `onClick` and `onDoubleClick` handlers are removed when in Input state.
 *    - It's possible to pass both `onClick` and `onDoubleClick` handlers (see below).
 *
 * Notes:
 *    - React only has single or double click events.
 *    - The default React behavior, if both handlers are passed, is:
 *      1. the `onClick` fires twice,
 *      2. then `onDoubleClick` event fires after.
 *    - When `inputClicks >= 2` or `onDoubleClick` handler exists,
 *      this component skips `onClick` event when `onDoubleClick` fires with a delay,
 *      treating `onClick` as single or more than two clicks event.
 *    - `onClick` event can check the count of clicks with `event.detail: number`.
 *
 * Architecture:
 *    - Inner `<input/>` Components can have their own logic to manage internal `state.value`
 *      using `format` functions. Thus, we must keep it dry and sync with that `state.value`,
 *      to avoid calling `format` functions twice.
 *    - Button state is designed for readonly UI, so it should derive value from inner `<input/>`
 *    - Cache inner `<input/>` state to render Button after edit, and when switching back to Input.
 *      Alternatively, render both Button and Input, then hide one of them - requires syncing.
 *      => Cache approach has simpler logic and is more performant with clean markup.
 */
export function InputButton (_props) {
  const [self, {isInput}] = useInstance()

  // Compute value for Input Control component
  const {defaultValue, value, Input} = _props
  useInputValue({defaultValue, value}, _props, self) // this mutates self.state.value

  // Event Handlers --------------------------------------------------------------------------------
  if (!self.props) {
    // Click event handlers
    self.onClick = function (e) {
      if (self.isDrag) return
      switch (e.detail) {
        case 2:
          const {onDoubleClick} = self.props
          if (onDoubleClick) onDoubleClick.apply(this, arguments)
          break
        case 1:
        default:
          const {onClick} = self.props
          if (onClick) onClick.apply(this, arguments)
      }
      if (e.defaultPrevented) return

      if (
        (e.detail === self.props.inputClicks) ||
        (e.detail === 0 && self.props.inputClicks === 1) // Enter press will trigger `click` in View
      )
        self.setState({isInput: true})
    }
    self.onClickDelayed = debounce(self.onClick, TIME_DURATION_INSTANT)

    // To differentiate `click` from `drag`, we monitor `pointermove` events on the Button
    self.onPointerDown = onEventHandler('onPointerDown', self, () => (self.isDrag = false))
    self.onPointerMove = onEventHandler('onPointerMove', self, () => (self.isDrag = true))

    // Input `onBlur` handler that may call `onChange` value
    self.onBlur = onEventHandler('onBlur', self, function (e) {
      // onBlur event may send parsed value for backend, but input state stores formatted value.
      // This component should sync with input state to render correct value (ie. e.target.value)
      // See Input.md for how `format`/`parse` functions work.
      const value = self.getStateValue.apply(this, arguments)
      const {onChange} = self.props
      if (onChange && value !== self.state.value) onChange.apply(this, arguments)
      self.setState({isInput: false, value: e.defaultPrevented ? self.state.value : value})
    })

    // Do not use `onKeyPress` because its deprecated and does not capture Escape
    self.onKeyUp = onEventHandler('onKeyUp', self, function (e) {
      if (!isPureKeyPress(e)) return
      switch (e.key) {
        case 'Enter': // fires `onChange` without loosing focus
          self.change.apply(this, arguments)
          break
        case 'Escape': // switch back to Button without firing `onChange`
          self.blur.apply(this, arguments)
          break
      }
    })

    // Simulate `onBlur` event for consistency, without changing `value` (does not fire `self.onBlur`)
    self.blur = function (e) {
      const {onBlur, name} = self.props
      if (onBlur) onBlur.call(this, e, self.getParsedValue.call(this, e), name, self)
      if (e.defaultPrevented) return
      self.setState({isInput: false})
    }

    // Syncs with `useInputSetup` behavior ---------------------------------------------------------
    self.change = function (e) {
      const value = self.getStateValue.apply(this, arguments)
      const {onChange, name} = self.props
      if (onChange && value !== self.state.value)
        onChange.call(this, e, self.getParsedValue.call(this, e, value), name, self)
      if (e.defaultPrevented) return
      self.setState({value})
    }

    self.getParsedValue = function (e, value = self.state.value) {
      const {parse, name} = self.props
      if (parse) value = parse.call(this, value, name, self, e)
      return value
    }

    // Get `self.state.value` or `event.target.value` from event
    self.getStateValue = function (e, v, n, s) {
      const {state: {value = e.target.value} = {}} = s || {}
      return value
    }
  }
  self.props = _props

  // Render Props ----------------------------------------------------------------------------------
  let props
  // Button props
  if (!isInput) {
    let {btnType, inputClicks, onDoubleClick, inputOnlyAttrs, ...btnProps} = _props
    inputOnlyAttrs.forEach(key => delete btnProps[key])
    btnProps.onClick = (inputClicks > 1 || onDoubleClick) ? self.onClickDelayed : self.onClick
    btnProps.onPointerDown = self.onPointerDown
    btnProps.onPointerMove = self.onPointerMove
    btnProps.type = btnType
    btnProps.children = renderProp(self.state.value, self) // wrap with Text for styling cursor indicator
    props = btnProps
  }
  // Input props
  else {
    let {
      // Removed props in Input state
      onClick, onChange, btnType, format, // format is removed to avoid being called twice
      ...inputProps
    } = _props
    // todo: improvement 3 - set caret position on click
    // It's quite tricky to simulate click -> input does not get focused like when
    // the user clicks for real. The only way to focus on input programmatically, at the moment
    // of writing, is to call `input.focus()`, then `input.setSelectionRange()`,
    // which requires the `selectionStart` position that we do not have a way to compute.
    // => so using autofocus for now.
    inputProps.autoFocus = true
    if (inputProps.compact == null) inputProps.compact = 0
    inputProps.onKeyUp = self.onKeyUp
    inputProps.onBlur = self.onBlur
    inputProps.value = self.state.value
    props = inputProps
  }
  delete props.Input
  delete props.inputClicks
  delete props.inputOnlyAttrs
  delete props.onDoubleClick // this is handled by self.onCLick

  return <Input {...props} />
}

InputButton.defaultProps = {
  btnType: 'view', // Use View, because Button does not allow text selection, and has style conflicts
  controls: {
    'view': ViewWithLabel,
  },
  Input,
  inputClicks: 1,
  inputOnlyAttrs: [
    // 'controls', 'error', 'info', 'helpTransition', 'type',
    'compact', 'controlledValue', 'defaultValue', 'value', 'onRemove', 'format', 'parse',
    'prefix', 'suffix', 'stickyPlaceholder', 'noSpellCheck', 'childBefore', 'childAfter',
    'icon', 'iconEnd',
  ],
}
InputButton.propTypes = {
  // Button Component `type` to use (as defined by Input `controls` prop)
  btnType: type.String,
  // Universal Input Component to use (must render inner `<input/>` by `type`, including `btnType`)
  Input: type.JSXElementType,
  // Number of clicks to turn into Input, set as 2 for Double Click, default is single click
  inputClicks: type.Enum([1, 2]),
  // List of props to remove when in Button state (ie. for Input state only)
  inputOnlyAttrs: type.ListOf(type.String),
  // ...other props to pass to Button or Input
}

export default React.memo(InputButton)

function ViewWithLabel ({label, className, type, ...props}) {
  return (<>
    {label != null && <Label className='input__label'>{renderProp(label)}</Label>}
    <View className={cn(className, 'input--btn')} {...props} />
  </>)
}
