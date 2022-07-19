<script>
  import { cn } from '@webframer/utils/components.js'
  import { onDestroy, onMount } from 'apps/views/svelte/index.js'
  import Col from './Col.svelte' // These phrases are to be animated in turn,
  import Text from './Text.svelte'

  // These phrases are to be animated in turn,
  // each phrase can have a different number of text variations
  export let phrases = [
    [
      'Design 🎩',
      'Develop 🏆',
      'Deploy 😎',
    ],
    [
      'beautiful websites fast!',
      'custom apps without coding!',
      'scalable performant apps!',
      'software with best practices!',
      'your Webframe.app now!'
    ],
  ]
  // Animation Delay in milliseconds
  export let delay = 2000
  // Animation speed per character in milliseconds
  export let typeSpeed = 80 // one character every ~5 frames at 60 FPS
  // Animation speed per character in milliseconds
  export let eraseSpeed = 16
  // Delay between phrases of text in milliseconds
  export let phraseGap = 1000
  // Delay between cycles of text variations in milliseconds
  export let cycleGap = 1000
  // Typewriter cursor
  export let cursor = '|'
  // Whether to render cursor in dark mode
  export let dark = false
  export let row = true
  export let underline = false
  // Fix line-height issue on Safari when using emoji with 1.2em (browser's standard)
  // @see: https://stackoverflow.com/questions/70037803/emojis-are-causing-change-in-line-height
  export let styleText = 'line-height: 1.2em'

  // Displayed cursors
  let _cursors = Array(phrases.length).fill('')
  // the actual text phrase to display
  let _phrases = phrases.map(phrase => phrase[0])

  // Extra character is needed for the cursor to prevent overflow
  const phraseMaxLengths = phrases.map(phrase => Math.max(...phrase.map(v => v.length)))
  const phrasePadStrings = phraseMaxLengths.map(length => Array(length + cursor.length).fill('_').join(''))
  let timer

  onMount(() => {
    // Since animation cycles through each phrase, one after another,
    // the phrase with most text variations will cause all other phrases
    // to loop through the same number of times.
    const indexByPhrase = phrases.map(() => 0)
    const maxVariationCycles = Math.max(...phrases.map(phrase => phrase.length))

    // A complete animation cycle for all text variations in each phrase
    function animationCycle () {
      let _delay = 0, _lastDelay = 0
      for (let i = 0; i < maxVariationCycles; i++) {
        phrases.forEach((phrase, index) => {
          indexByPhrase[index]++
          indexByPhrase[index] = indexByPhrase[index] % phrase.length
          const text = phrase[indexByPhrase[index]]
          const prevText = phrase[(indexByPhrase[index] || phrase.length) - 1]
          _delay += _lastDelay + phraseGap
          setTimeout(() => {
            setTimeout(() => typeText(index, text), eraseText(index, prevText))
            // The last animation in the cycle
            if (timer != null && i === maxVariationCycles - 1 && index === phrases.length - 1) {
              timer = setTimeout(animationCycle, _lastDelay + cycleGap) // repeat animation
            }
          }, _delay) // delay by animation time for all previous phrases
          _lastDelay = text.length * (typeSpeed + eraseSpeed) // new delay for the next phrase
        })
        _delay += cycleGap
      }
    }

    // Animation
    function typeText (phraseIndex, string) {
      const length = phrasePadStrings[phraseIndex].length
      let charIndex = 0, delay = 0
      while (charIndex < length) {
        charIndex++
        const text = string.substring(0, charIndex)
        setTimeout(() => {
          _phrases[phraseIndex] = text
          _phrases = _phrases
        }, delay)
        delay = charIndex * typeSpeed
      }
      return delay
    }

    // Animation
    function eraseText (phraseIndex, string) {
      const length = phrasePadStrings[phraseIndex].length
      let charIndex = length, delay = 0
      _cursors.forEach((_v, i, array) => (array[i] = phraseIndex === i ? cursor : ''))
      _cursors = _cursors
      while (charIndex) {
        charIndex--
        const text = string.substring(0, charIndex)
        setTimeout(() => {
          _phrases[phraseIndex] = text
          _phrases = _phrases
        }, delay)
        delay = (length - charIndex) * eraseSpeed
      }
      return delay
    }

    // Interval is unreliable because CPU could be out of sync, better to repeat timeout once finished
    timer = setTimeout(animationCycle, delay)
  })

  onDestroy(() => {
    clearTimeout(timer)
    timer = null
  })

</script>
<div class:typewriter={true} class:row class:wrap={row} class:col={!row} {...$$restProps}>
  {#each phrases as _phrase, i}
    <Col class='max-width'>
      <Text class={cn("break-words", {invisible: !underline})} style={styleText}>{phrasePadStrings[i]}</Text>
      <Text class='position-absolute' style={styleText}>
        {_phrases[i]}<u class:dark>{_cursors[i]}</u>
      </Text>
    </Col>
  {/each}
</div>

<style lang="less">
  .typewriter {
    max-width: 100%;
    overflow: hidden;
  }

  @keyframes blink {
    from {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  u {
    animation: blink 1s infinite;
    color: black;
    -webkit-text-stroke: thin white;

    &.dark {
      color: white;
      -webkit-text-stroke: thin black;
    }
  }
</style>
