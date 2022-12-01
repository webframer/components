import { cloneDeep, Id } from '@webframer/js'

/**
 *
 * @param {object} view - current json markup for this Table Component (immutable proxy)
 * @param layout
 */
export function onToggleLayout (view, { vertical }) {
  view.vertical = vertical
  if (vertical) {
    // rearrange #child for head and body slots
  } else {

  }
}

/**
 * Add Column in horizontal layout, or Row in vertical layout
 */
export function onAddHeader ({vertical, ['#child']: items}) {
  const body = items.find((slot) => slot.name === 'body')
  const newHeader = {
    '#tag': 'th',
    '#drop': false, // '#drop' false gets converted to '_nodrop=""' in HTML markup
    '#child': [
      {
        '#tag': 'Text',
        children: 'Header',
      },
    ],
  }
  const newCell = {
    '#tag': 'td',
    '#drag': false, // '#drag' false gets converted to '_nodrag=""' in HTML markup
    '#child': [
      {
        '#tag': 'Text',
        children: 'Cell',
      },
    ],
  }
  if (!vertical) {
    const head = items.find((slot) => slot.name === 'head')
    head['#child'].forEach(tr => {
      tr['#child'].push(newHeader)
    })
    body['#child'].forEach(tr => {
      tr['#child'].push(cloneDeep(newCell))
    })
  } else {
    let columns = 1
    body['#child'].forEach(tr => {
      if (tr['#child'].length - 1 > columns) columns = tr['#child'].length - 1
    })
    body['#child'].push({
      '#tag': 'tr',
      '#id': Id({caseSensitive: true}), // '#id' gets converted to '_id' in HTML markup
      '#child': [
        newHeader,
        ...Array(columns - 1).fill(true).map(() => cloneDeep(newCell)),
      ],
    })
  }
}

/**
 * Remove Column in horizontal layout, or Row in vertical layout
 */
export function onRemoveHeader ({vertical, ['#child']: items}, {index}) {
  const body = items.find((slot) => slot.name === 'body')

  // If index not defined, delete the last element
  if (index == null) {
    if (!vertical) {
      index = 1
      body['#child'].forEach(tr => {
        if (tr['#child'].length - 1 > index) index = tr['#child'].length - 1
      })
    } else {
      index = body['#child'].length - 1
    }
  }

  Math.max(1, index) // cannot delete the last column/row

  if (!vertical) {
    // the head section can contain multiple header rows, the number of columns is the max length
    // since grouped cell can have colSpan >= 1, which should not be deleted
    // todo: handle grouped cells with colSpan >= 1, for now just delete the indexed cell
    const head = items.find((slot) => slot.name === 'head')
    head['#child'].forEach(tr => {
      tr['#child'].splice(index, 1)
    })
    body['#child'].forEach(tr => tr['#child'].splice(index, 1))
  } else {
    body['#child'].splice(index, 1)
  }
}

/**
 * Add Row in horizontal layout, or Column in vertical layout
 */
export function onAddCells () {

}

/**
 * Remove Row in horizontal layout, or Column in vertical layout
 */
export function onRemoveCells () {

}
