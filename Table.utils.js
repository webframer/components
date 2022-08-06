import { cloneDeep, Id } from '@webframer/js'

/**
 *
 * @param {object} view - current json markup for this Table Component (immutable proxy)
 * @param layout
 */
export function onToggleLayout (view, { vertical }) {
  view.vertical = vertical
  if (vertical) {
    // rearrange @list for head and body slots
  } else {

  }
}

/**
 * Add Column in horizontal layout, or Row in vertical layout
 */
export function onAddHeader ({ vertical, ['@list']: list }) {
  const body = list.find((slot) => slot.name === 'body')
  const newHeader = {
    '@view': 'th',
    '@dnd': true,
    '@list': [
      {
        '@view': 'Text',
        children: 'Header',
      },
    ],
  }
  const newCell = {
    '@view': 'td',
    '@dnd': true,
    '@list': [
      {
        '@view': 'Text',
        children: 'Cell',
      },
    ],
  }
  if (!vertical) {
    const head = list.find((slot) => slot.name === 'head')
    head['@list'].forEach(tr => {
      tr['@list'].push(newHeader)
    })
    body['@list'].forEach(tr => {
      tr['@list'].push(cloneDeep(newCell))
    })
  } else {
    let columns = 1
    body['@list'].forEach(tr => {
      if (tr['@list'].length - 1 > columns) columns = tr['@list'].length - 1
    })
    body['@list'].push({
      '@view': 'tr',
      '@id': Id({ caseSensitive: true }),
      '@list': [
        newHeader,
        ...Array(columns - 1).fill(true).map(() => cloneDeep(newCell)),
      ],
    })
  }
}

/**
 * Remove Column in horizontal layout, or Row in vertical layout
 */
export function onRemoveHeader ({ vertical, ['@list']: list }, { index }) {
  const body = list.find((slot) => slot.name === 'body')

  // If index not defined, delete the last element
  if (index == null) {
    if (!vertical) {
      index = 1
      body['@list'].forEach(tr => {
        if (tr['@list'].length - 1 > index) index = tr['@list'].length - 1
      })
    } else {
      index = body['@list'].length - 1
    }
  }

  Math.max(1, index) // cannot delete the last column/row

  if (!vertical) {
    // the head section can contain multiple header rows, the number of columns is the max length
    // since grouped cell can have colSpan >= 1, which should not be deleted
    // todo: handle grouped cells with colSpan >= 1, for now just delete the indexed cell
    const head = list.find((slot) => slot.name === 'head')
    head['@list'].forEach(tr => {
      tr['@list'].splice(index, 1)
    })
    body['@list'].forEach(tr => tr['@list'].splice(index, 1))
  } else {
    body['@list'].splice(index, 1)
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
