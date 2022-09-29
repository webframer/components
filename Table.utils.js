import { cloneDeep, Id } from '@webframer/js'

/**
 *
 * @param {object} view - current json markup for this Table Component (immutable proxy)
 * @param layout
 */
export function onToggleLayout (view, { vertical }) {
  view.vertical = vertical
  if (vertical) {
    // rearrange #items for head and body slots
  } else {

  }
}

/**
 * Add Column in horizontal layout, or Row in vertical layout
 */
export function onAddHeader ({vertical, ['#items']: items}) {
  const body = items.find((slot) => slot.name === 'body')
  const newHeader = {
    '#view': 'th',
    '#drop': false, // '#drop' false gets converted to '_nodrop=""' in HTML markup
    '#items': [
      {
        '#view': 'Text',
        children: 'Header',
      },
    ],
  }
  const newCell = {
    '#view': 'td',
    '#drag': false, // '#drag' false gets converted to '_nodrag=""' in HTML markup
    '#items': [
      {
        '#view': 'Text',
        children: 'Cell',
      },
    ],
  }
  if (!vertical) {
    const head = items.find((slot) => slot.name === 'head')
    head['#items'].forEach(tr => {
      tr['#items'].push(newHeader)
    })
    body['#items'].forEach(tr => {
      tr['#items'].push(cloneDeep(newCell))
    })
  } else {
    let columns = 1
    body['#items'].forEach(tr => {
      if (tr['#items'].length - 1 > columns) columns = tr['#items'].length - 1
    })
    body['#items'].push({
      '#view': 'tr',
      '#id': Id({caseSensitive: true}), // '#id' gets converted to '_id' in HTML markup
      '#items': [
        newHeader,
        ...Array(columns - 1).fill(true).map(() => cloneDeep(newCell)),
      ],
    })
  }
}

/**
 * Remove Column in horizontal layout, or Row in vertical layout
 */
export function onRemoveHeader ({vertical, ['#items']: items}, {index}) {
  const body = items.find((slot) => slot.name === 'body')

  // If index not defined, delete the last element
  if (index == null) {
    if (!vertical) {
      index = 1
      body['#items'].forEach(tr => {
        if (tr['#items'].length - 1 > index) index = tr['#items'].length - 1
      })
    } else {
      index = body['#items'].length - 1
    }
  }

  Math.max(1, index) // cannot delete the last column/row

  if (!vertical) {
    // the head section can contain multiple header rows, the number of columns is the max length
    // since grouped cell can have colSpan >= 1, which should not be deleted
    // todo: handle grouped cells with colSpan >= 1, for now just delete the indexed cell
    const head = items.find((slot) => slot.name === 'head')
    head['#items'].forEach(tr => {
      tr['#items'].splice(index, 1)
    })
    body['#items'].forEach(tr => tr['#items'].splice(index, 1))
  } else {
    body['#items'].splice(index, 1)
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
