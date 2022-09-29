import { interpolateString } from '@webframer/js'
import { onAddCells, onAddHeader, onRemoveCells, onRemoveHeader, onToggleLayout } from './Table.utils.js'

// Component Definition
export default {
  // Custom Edit Actions when Table is selected (can be applied to any element in UI?)
  actions: [
    {
      action: onAddHeader, // (state: ui.json, args: object)
      // Action triggers on `click` event by default, if label returns primitive value
      label: ({vertical}) => interpolateString('+ Add {v}', {v: vertical ? 'Row' : 'Column'}),
    },
    {
      action: onAddCells, // (state: ui.json, args: object)
      label: ({vertical}) => interpolateString('+ Add {v}', {v: vertical ? 'Column' : 'Row'}),
    },
    {
      action: onRemoveHeader, // (state: ui.json, args: object)
      label: ({vertical}) => interpolateString('- Reduce {v}', {v: vertical ? 'Row' : 'Column'}),
    },
    {
      action: onRemoveCells, // (state: ui.json, args: object)
      label: ({vertical}) => interpolateString('- Reduce {v}', {v: vertical ? 'Column' : 'Row'}),
    },
    {
      action: onToggleLayout, // (state: ui.json, args: object)
      // If label returns an object (ui.json), action needs to be triggered manually
      label: ({vertical}) => ({
        '#view': 'Input',
        name: 'vertical', // ui.json attribute to modify
        type: 'tabs',
        label: 'Table Layout',
        onChange: '@action', // => action will receive {formValues: {vertical: true}, event} as args
        values: [
          {
            value: false,
            label: 'Horizontal',
            active: !vertical,
          },
          {
            value: true,
            label: 'Vertical',
            active: vertical,
          },
        ],
      }),
    },
  ],

  // default ui.json attributes
  defaultProps: {
    class: 'table',
    '#items': [
      { // all private attributes (starting with #) will be ignored in production
        '#view': 'slot',
        '#dnd': false, // dnd is enabled by default in Edit mode
        name: 'head',
        '#items': [
          {
            '#view': 'tr',
            '#drop': false,
            '#items': [
              {
                '#view': 'th', // `@id` is to be injected by the platform automatically
                '#drag': false,
                '#items': [
                  {
                    '#view': 'Text',
                    children: 'Header A',
                  },
                ],
              },
              {
                '#view': 'th',
                '#drag': false,
                '#items': [
                  {
                    '#view': 'Text',
                    children: 'Header B',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        '#view': 'slot',
        '#dnd': false,
        name: 'body',
        '#items': [
          {
            '#view': 'tr',
            '#drop': false,
            '#items': [
              {
                '#view': 'td',
                '#drag': false,
                '#items': [
                  {
                    '#view': 'Text',
                    children: 'Cell A1',
                  },
                ],
              },
              {
                '#view': 'td',
                '#drag': false,
                '#items': [
                  {
                    '#view': 'Text',
                    children: 'Cell B1',
                  },
                ],
              },
            ],
          },
          {
            '#view': 'tr',
            '#drop': false,
            '#items': [
              {
                '#view': 'td',
                '#drag': false,
                '#items': [
                  {
                    '#view': 'Text',
                    children: 'Cell A2',
                  },
                ],
              },
              {
                '#view': 'td',
                '#drag': false,
                '#items': [
                  {
                    '#view': 'Text',
                    children: 'Cell B2',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
}
