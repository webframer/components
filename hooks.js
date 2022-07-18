import { useRef, useState } from 'react'

/**
 * React Hook to simulate Class Component behaviors with `this` instance.
 * @example:
 *    const self = useInstance({count: 0, length: 10})
 *    self.setState({count: 1}) >>> self.state == {count: 1, length: 10}
 *    self.forceUpdate() >>> re-renders the component
 *
 * @param {object} [initialState]
 * @returns {object} instance - that persists for the entire component existence
 */
export function useInstance (initialState = {}) {
  const {current: instance} = useRef({})
  const [state, setState] = useState(initialState)
  instance.state = state
  if (!instance.setState) {
    instance.setState = (newState) => setState(state => ({...state, ...newState}))
    instance.forceUpdate = () => setState(state => ({...state}))
  }
  console.warn('---------->')
  return instance
}
