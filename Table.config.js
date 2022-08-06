import { interpolateString } from '@webframer/js'
import { onAddCells, onAddHeader, onRemoveCells, onRemoveHeader, onToggleLayout } from './Table.utils.js'

// Component Definition
export default {
  // Custom Edit Actions when Table is selected (can be applied to any element in UI?)
  actions: [
    {
      action: onAddHeader, // (state: view.json, args: object)
      // Action triggers on `click` event by default, if label returns primitive value
      label: ({ vertical }) => interpolateString('+ Add {v}', { v: vertical ? 'Row' : 'Column' }),
    },
    {
      action: onAddCells, // (state: view.json, args: object)
      label: ({ vertical }) => interpolateString('+ Add {v}', { v: vertical ? 'Column' : 'Row' }),
    },
    {
      action: onRemoveHeader, // (state: view.json, args: object)
      label: ({ vertical }) => interpolateString('- Reduce {v}', { v: vertical ? 'Row' : 'Column' }),
    },
    {
      action: onRemoveCells, // (state: view.json, args: object)
      label: ({ vertical }) => interpolateString('- Reduce {v}', { v: vertical ? 'Column' : 'Row' }),
    },
    {
      action: onToggleLayout, // (state: view.json, args: object)
      // If label returns an object (view.json), action needs to be triggered manually
      label: ({ vertical }) => ({
        '@view': 'Input',
        name: 'vertical', // view.json attribute to modify
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

  // default view.json attributes
  defaultProps: {
    class: 'table',
    '@list': [
      {
        '@view': 'slot',
        name: 'head',
        '@list': [
          {
            '@view': 'tr',
            '@list': [
              {
                '@view': 'th', // `@id` is to be injected by the platform automatically
                '@dnd': true,
                '@list': [
                  {
                    '@view': 'Text',
                    children: 'Header A',
                  },
                ],
              },
              {
                '@view': 'th',
                '@dnd': true,
                '@list': [
                  {
                    '@view': 'Text',
                    children: 'Header B',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        '@view': 'slot',
        name: 'body',
        '@list': [
          {
            '@view': 'tr',
            '@list': [
              {
                '@view': 'td',
                '@dnd': true,
                '@list': [
                  {
                    '@view': 'Text',
                    children: 'Cell A1',
                  },
                ],
              },
              {
                '@view': 'td',
                '@dnd': true,
                '@list': [
                  {
                    '@view': 'Text',
                    children: 'Cell B1',
                  },
                ],
              },
            ],
          },
          {
            '@view': 'tr',
            '@list': [
              {
                '@view': 'td',
                '@dnd': true,
                '@list': [
                  {
                    '@view': 'Text',
                    children: 'Cell A2',
                  },
                ],
              },
              {
                '@view': 'td',
                '@dnd': true,
                '@list': [
                  {
                    '@view': 'Text',
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
