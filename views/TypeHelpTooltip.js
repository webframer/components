import * as React from 'react'
import { useCallback } from 'react'
import Text from '../components/Text.js'
import { Markdown, mdJSX, Tooltip, View } from '../index.js'

/**
 * Help description popover explaining the control type
 */
export function TypeHelpTooltip ({_type, text, desc}) {
  const children = useCallback(() => (
    <View className='type__help'>
      <Text className='h6'>{text}</Text>
      {desc &&
        <Markdown components={mdJSX} className='margin-top-smallest'>
          {desc + (_type ? `\n\n\`${_type.description}\` type` : '')}
        </Markdown>
      }
    </View>
  ), [_type, text, desc])
  return <Tooltip {...helpTooltipProps} children={children} />
}

const TypeHelpTooltipMemo = React.memo(TypeHelpTooltip)
export default TypeHelpTooltipMemo

export const helpTooltipProps = {
  className: 'max-width-400',
  on: ['click', 'focus', 'hover'],
  position: 'right',
  theme: 'glass',
}
