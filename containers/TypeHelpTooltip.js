import React, { useCallback } from 'react'
import { Markdown, mdJSX, Tooltip, View } from '../index.js'
import Text from '../Text.js'

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
  return <Tooltip className='max-width-400' position='right' children={children} />
}

export default React.memo(TypeHelpTooltip)
