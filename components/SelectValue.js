import React, { useCallback, useMemo } from 'react'
import { onEventStopPropagation } from '../utils/interaction.js'
import Icon from './Icon.js'
import { InputView } from './InputView.js'

/**
 * Selected Option Value as InputView.
 * @example:
 *   import { Select, renderSelected } from '@webframer/ui'
 *       <Select
 *         {...props}
 *         label='Multiple Select (editable)'
 *         multiple search icon={false}
 *         renderSelected={renderSelected}
 *       />
 */
export function SelectValue ({value, index, self, ...props}) {
  const onChange = useCallback((e, val) => {
    self.updateValue(e, val, index)
  }, [index])

  const viewProps = useMemo(() => ({
    controlProps: {
      className: 'input--tag',
      childAfter: (
        <Icon className='select__value__delete' name='delete'
              onClick={onEventStopPropagation(function (e) {
                self.deleteValue.call(this, e, value)
              })} tabIndex={-1} />
      ),
    },
  }), [value])

  const inputProps = useMemo(() => ({
    controlProps: {
      className: 'input--tag',
    },
  }), [])

  return (
    <InputView
      className='select__value no-border no-bg'
      viewProps={viewProps}
      inputProps={inputProps}
      onChange={onChange}
      value={value}
      {...props}
    />
  )
}

const SelectValueMemo = React.memo(SelectValue)
SelectValueMemo.name = SelectValue.name
SelectValueMemo.propTypes = SelectValue.propTypes
SelectValueMemo.defaultProps = SelectValue.defaultProps
export default SelectValueMemo

/**
 * Selected Option Renderer for Select Component
 */
export function renderSelected (value, index, array, self) {
  return <SelectValueMemo key={index} {...{value, index, self}} />
}
