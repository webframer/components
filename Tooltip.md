## Tooltip API

The ideal API for tooltip should:

- Maintain current layout markup, without introducing extra wrappers.
- Simple addition steps, without complex setup (i.e. no ref to assign).
- Accessible and user-friendly (i.e. opens only when needed, closes automatically).
- Works on all screen sizes and layouts.
- Customisable positions and layout behaviors.
- Available for all base components, like View, Button, Input.
- Easy to enhance custom components with the `tooltip` prop.

```js
// Component implementation
<View tooltip={{position: 'top', theme: 'dark', on: 'click', children: 'Tooltip Text'}}>{children}</View>
<Button tooltip='Tooltip Text'>{children}</Button>

// View.jsx setup
const [tooltip] = useTooltip(props)
return <div>{children}{tooltip}</div>
```

**Reference:**
https://www.npmjs.com/package/react-tooltip
