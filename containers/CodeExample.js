import { _, l, translate } from '@webframer/js'
import React, { useMemo, useState } from 'react'
import Icon from '../Icon.js'
import { Button, cn, Expand, extractProps, Markdown, mdJSX, Row, type, View } from '../index.js'
import Text from '../Text.js'

/**
 * Renders `children` along with its source code representation
 */
export function CodeExample ({children, className, source = '', desc, ...view}) {
  const [open, setOpen] = useState(false)
  const sourceCode = useMemo(() => source
    .replace(CODE_INDENT_REGEX, '\n')
    .replace(CODE_TRIM_REGEX, ''), [source])
  return (
    <View className={cn('CodeExample', className, 'embossed rounded')} {...extractProps(view)}>
      <Row>
        <View className='padding fill middle'>
          <Text className='CodeExample__desc p fill faded'>{desc || _.EXAMPLE}</Text>
        </View>
        <Row className='middle padding-h wrap'>
          <Button className='gap-smaller btn-transparent padding-v-smallest padding-h-smaller fade'
                  onClick={() => setOpen(!open)}>
            <Icon name='hi/code' className='font-large' />
            <Text className='font-small'>{open ? _.HIDE_CODE : _.SHOW_CODE}</Text>
          </Button>
        </Row>
      </Row>
      <Row className={cn('reverse fill padding-h padding-bottom wrap', {gap: open})}>
        <Expand asPanel direction='width' duration={700} open={open}>
          {() => (
            <Markdown className={cn('fill debossed rounded')}
                      components={mdJSX} children={`~~~jsx\n${sourceCode}\n~~~`} />
          )}
        </Expand>
        <View className='debossed fill middle center padding-largest rounded'>
          {children}
        </View>
      </Row>
    </View>
  )
}

CodeExample.propTypes = {
  // Example source code
  children: type.Node.isRequired,
  // `children` as literal source code string for documentation
  source: type.String,
  // Description text - default is "Example"
  desc: type.String,
}

export default React.memo(CodeExample)

translate({
  EXAMPLE: {
    [l.ENGLISH]: 'Example',
  },
  SHOW_CODE: {
    [l.ENGLISH]: 'Show Code',
  },
  HIDE_CODE: {
    [l.ENGLISH]: 'Hide Code',
  },
})

export const CODE_TRIM_REGEX = /^\n+|\n+$/g
export const CODE_INDENT_REGEX = /\n\s{2}/g
