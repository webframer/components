import { _, l, translate } from '@webframer/js'
import cn from 'classnames'
import * as React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { Button } from '../components/Button.js'
import { Expand } from '../components/Expand.js'
import { mdJSX } from '../components/HighlightJSX.js'
import Icon from '../components/Icon.js'
import { Markdown } from '../components/Markdown.js'
import { Row } from '../components/Row.js'
import Text from '../components/Text.js'
import { extractProps, View } from '../components/View.js'
import Switch from '../inputs/Switch.js'
import { renderProp } from '../react/render.js'
import { type } from '../types.js'

/**
 * Renders `children` along with its source code representation.
 * @see https://webframe.app/docs/ui/views/CodeExample
 */
export function CodeExample ({children, className, source = '', desc, ...view}) {
  const [open, setOpen] = useState(false)
  const sourceCode = useMemo(() => source
    .replace(CODE_INDENT_REGEX, '\n')
    .replace(CODE_TRIM_REGEX, ''), [source])

  // RTL toggle switch -----------------------------------------------------------------------------
  const [rtl, setRtl] = useState(!!view.rtl)
  const toggleDir = useCallback((_e, value) => setRtl(value), [setRtl])

  return (
    <View className={cn('CodeExample', className, 'embossed rounded')} {...extractProps(view)}>
      <Row>
        <View className='CodeExample__desc padding fill middle'>
          <Text className='p fill faded'>{desc || _.EXAMPLE}</Text>
        </View>
        <Row className='CodeExample__buttons middle padding-h gap'>
          <Switch className='font-smallest appear-on-hover-only'
                  onChange={toggleDir}
                  value={rtl}
                  title={_.TOGGLE_LAYOUT_DIRECTION}
                  checkedLabel={<Text className='font-smaller'>{_.RTL}</Text>}
                  uncheckedLabel={<Text className='font-smaller'>{_.LTR}</Text>} />
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
            <Markdown className={cn('CodeExample__source fill')}
                      components={mdJSX} children={`~~~jsx\n${sourceCode}\n~~~`} />
          )}
        </Expand>
        <View className='CodeExample__preview fill middle center padding-largest' rtl={rtl}>
          {renderProp(children, {props: arguments[0]})}
        </View>
      </Row>
    </View>
  )
}

CodeExample.propTypes = {
  // Example source code
  children: type.NodeOrFunction.isRequired,
  // Description text - default is "Example"
  desc: type.String,
  // `children` as literal source code string for documentation
  // Autogenerate this using [webframe-docs](https://www.npmjs.com/package/webframe-docs) CLI.
  source: type.String,
}

const CodeExampleMemo = React.memo(CodeExample)
export default CodeExampleMemo

translate({
  EXAMPLE: {
    [l.ENGLISH]: 'Example',
  },
  HIDE_CODE: {
    [l.ENGLISH]: 'Hide Code',
  },
  SHOW_CODE: {
    [l.ENGLISH]: 'Show Code',
  },
  LTR: {
    [l.ENGLISH]: 'LTR',
  },
  RTL: {
    [l.ENGLISH]: 'RTL',
  },
  TOGGLE_LAYOUT_DIRECTION: {
    [l.ENGLISH]: 'Toggle Layout Direction',
  },
})

export const CODE_TRIM_REGEX = /^\n+|\n+$/g
export const CODE_INDENT_REGEX = /\n\s{2}/g
