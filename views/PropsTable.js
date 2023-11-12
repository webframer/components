import { _, extractPrivateProps, isFunction, l, startCase, toJSON, translate } from '@webframer/js'
import cn from 'classnames'
import * as React from 'react'
import { Fragment, useMemo } from 'react'
import { mdJSX } from '../components/HighlightJSX.js'
import { Markdown } from '../components/Markdown.js'
import { Row } from '../components/Row.js'
import Text from '../components/Text.js'
import Tooltip from '../components/Tooltip.js'
import { extractProps, View } from '../components/View.js'
import proptypes from '../propTypes.json.js'
import { type } from '../types.js'
import TypeHelpTooltip, { helpTooltipProps } from './TypeHelpTooltip.js'

/**
 * Component Props Table View.
 * @see https://webframe.app/docs/ui/views/PropsTable
 * @example:
 *  <PropsTable component={Button} />
 *  ┌────────────────┬───────────────────────┬──────────────┬──────────────────┐
 *  │ Prop           │ Type                  │ Default      │ Description      │
 *  ├────────────────┼───────────────────────┼──────────────┼──────────────────┤
 *  │ children       │ String | Number       │ Required     │ Button content   │
 *  ├────────────────┼───────────────────────┼──────────────┼──────────────────┤
 *  │ type           │ 'button' | 'submit'   │ 'button'     │                  │
 *  └────────────────┴───────────────────────┴──────────────┴──────────────────┘
 */
export function PropsTable ({component, manifest = proptypes, ...view}) {
  const {propTypes, name} = component
  if (!propTypes) return null

  const props = useMemo(() => {
    const result = []
    const {propTypes: p = {}, defaultProps = {}} = manifest[name] || {}
    for (const key in propTypes) {
      const propType = propTypes[key]
      if (!isFunction(propType) || !propType.controls) continue

      result.push({
        key,
        controlsOrPropTypes: propType['#_type'] === Symbol.for('Any') ? [propType] : propType.controls,
        defaultValue: toJSON(escapeValue(defaultProps[key]?.v || ''), null, 2),
        defaultHelp: defaultProps[key]?.c,
        description: p[key]?.c || propType['#desc'], // todo: turn @example: into code blocks
        required: propType.required,
      })
    }
    return result
  }, [propTypes, name, manifest])

  const pipe = <Text className='faded margin-h-smallest'>|</Text>

  return (
    <View className={cn('PropsTable table-wrap scrollable')} {...extractProps(view)}>
      <table className='table striped padded'>
        <colgroup>
          <col className='PropsTable__prop-column' />
          <col className='PropsTable__type-column' />
          <col className='PropsTable__default-column' />
          <col className='PropsTable__description-column' />
        </colgroup>
        <thead>
        <tr>
          <th className='text-align-start'>{_.PROP}</th>
          <th>{_.TYPE}</th>
          <th>{_.DEFAULT}</th>
          <th className='text-align-start'>{_.DESCRIPTION}</th>
        </tr>
        </thead>
        <tbody>
        {props.map(({key, controlsOrPropTypes, defaultValue, defaultHelp, description, required}) => {
          return (
            <tr key={key}>
              <td><Text className={cn('PropsTable__key', {required})}>{key}</Text></td>
              <td className='text-center'>
                <Row className='center middle wrap'>
                  {controlsOrPropTypes.map((control) => {
                    const type = startCase(getTypeFrom(control)?.description)
                    const {_type, text = type, desc, color} = extractPrivateProps(control, {mutate: false})
                    const style = color != null && !isFunction(color) ? {color} : undefined
                    // // Enumerable
                    // let type, style
                    // if (_type === Symbol.for('Enum') && hasListValue(control.options)) {
                    //   type = control.options.map(({value}, i, arr) => {
                    //     value = toText(value)
                    //     return (
                    //       <Fragment key={value}>
                    //         <Markdown components={mdJSX} children={`~~~jsx\n${value}\n~~~`}
                    //                   className='inline-block' />
                    //         {i < arr.length - 1 && pipe}
                    //       </Fragment>
                    //     )
                    //   })
                    //   // Other types
                    // } else {
                    // }
                    return {_type, text, desc, color, style, type}
                  })
                    .filter(({type}, i, arr) => arr.findIndex(v => v.type === type) === i)
                    .map(({_type, text, desc, style, type}, i, arr) => (
                      <Fragment key={text}>
                        <Row className='inline-flex middle wrap'>
                          <Text style={style}>{type}</Text>
                          <TypeHelpTooltip {...{_type, text, desc}} />
                        </Row>
                        {i < arr.length - 1 && pipe}
                      </Fragment>
                    ))
                  }
                </Row>
              </td>
              <td className='text-center'>
                {required && !defaultValue && <Text className='fade'>{_.REQUIRED}</Text>}
                {defaultValue &&
                  <Markdown components={mdJSX} children={`~~~jsx\n${defaultValue}\n~~~`} />
                }
                {defaultHelp && <Tooltip {...helpTooltipProps} children={defaultHelp} />}
              </td>
              <td>
                {description &&
                  <Markdown components={mdJSX} children={description} />}
              </td>
            </tr>
          )
        })}
        </tbody>
      </table>
    </View>
  )
}

PropsTable.propTypes = {
  /**
   * React Component element type
   * @example:
   *  import { Button } from '@webframer/ui'
   *  <PropsTable component={Button} />
   */
  component: type.JSXElementType.isRequired,
  // Content of the `propTypes.json` manifest file compiled by [webframe-docs](https://www.npmjs.com/package/webframe-docs)
  manifest: type.Object,
}

const PropsTableMemo = React.memo(PropsTable)
export default PropsTableMemo

// Helpers -----------------------------------------------------------------------------------------

translate({
  DEFAULT: {
    [l.ENGLISH]: 'Default',
  },
  DESCRIPTION: {
    [l.ENGLISH]: 'Description',
  },
  PROP: {
    [l.ENGLISH]: 'Prop',
  },
  REQUIRED: {
    [l.ENGLISH]: 'Required',
  },
  TYPE: {
    [l.ENGLISH]: 'Type',
  },
})

function escapeValue (string) {
  return string
    .replace(/('.*)\n(.*')/g, '$1\\n$2')
    .replace(/('.*)\t(.*')/g, '$1\\t$2')
}

/**
 * Get type symbol from Control config
 * @param {Control|{'#_type': symbol, '#type': symbol, type: any}} control
 * @returns {symbol|undefined} type - symbol from control, that falls back to '#_type'
 */
function getTypeFrom (control) {
  const {'#_type': _type, '#type': type = _type} = control
  return type
}
