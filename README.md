# Headless UI Components Library

This package contains commonly used **user interface components** (written in React by default).

All UI components are **headless** (i.e. no default CSS styling). For integrated UI themes and styles,
check the [style guide](https://webframe.app/docs/ui/styles), or provide your own.

## Why Should You Use this Library?

All Webframe UI components:

1. are headless, which means you can style everything from a clean-slate
2. follow [Open UI](https://open-ui.org/) standards regarding accessibility for WCAG 2 at Level AAA
3. are modular and composable for integration with low/no code platforms
4. have small bundle size with near-zero third party dependencies
5. are optimised for high performance to easily render 10K+ items
6. have smart defaults for minimum configuration
7. are very flexible with fully customisable behaviors (see below).

Custom behavior (beyond props configuration) is possible because every component has a `self` instance.
This `self` instance exposes public methods for manipulating its internal component states.

## Requirement

- ES6 compatible project, or must set this package to be transpiled.

## Installation

```bash
npm i @webframer/ui react react-dom
```

## Usage

```jsx
import { Scroll } from '@webframer/ui'

// Do not use this demo.css in production!
// @see https://webframe.app/docs/ui#getting-started
import '@webframer/ui/demo.css'

//... later in the code
return (
  <Scroll className='my-component'>
    {/* ...your code here */}
  </Scroll>
)
```

## Documentation

Go to [Webframe UI Docs](https://webframe.app/docs/ui) for complete API documentation, including instructions on how to
setup default UI Theme or custom styling with Tailwind CSS.
