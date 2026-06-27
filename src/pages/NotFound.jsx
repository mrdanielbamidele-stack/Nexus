import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import sceneHtml from './notFoundScene.html?raw'
import './NotFound.css'

const GSAP_SRC = 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js'
const MORPH_SRC = 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/MorphSVGPlugin.min.js'

// Load a script tag once and resolve when it's ready. Reused across mounts so
// the GSAP bundles are only fetched a single time.
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) {
      if (existing.dataset.loaded === 'true') resolve()
      else {
        existing.addEventListener('load', () => resolve())
        existing.addEventListener('error', reject)
      }
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true'
      resolve()
    })
    script.addEventListener('error', reject)
    document.head.appendChild(script)
  })
}

const DEFAULT_MESSAGE = (
  <>
    We know it&rsquo;s scary, but the page you&rsquo;re trying to reach can&rsquo;t be found.
    Perhaps it was just a bad <span>link</span> dream?
  </>
)

export default function NotFound({
  title = 'Hello?? Is somebody there?!?',
  message = DEFAULT_MESSAGE,
  homeTo = '/',
  homeLabel = 'Take me home',
}) {
  const rootRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    const timelines = []

    async function runAnimation() {
      // GSAP must load before MorphSVGPlugin (the plugin registers onto it).
      await loadScript(GSAP_SRC)
      await loadScript(MORPH_SRC)
      if (cancelled || !rootRef.current) return

      const { gsap, MorphSVGPlugin, TimelineMax, TweenMax, Linear, Quad } = window
      if (!gsap || !MorphSVGPlugin) return
      gsap.registerPlugin(MorphSVGPlugin)

      // The four mouth shapes the yeti morphs between while chattering/talking.
      const mouthShape1 = 'M149 115.7c-4.6 3.7-6.6 9.8-5 15.6.1.5.3 1.1.5 1.6.6 1.5 2.4 2.3 3.9 1.7l11.2-4.4 11.2-4.4c1.5-.6 2.3-2.4 1.7-3.9-.2-.5-.4-1-.7-1.5-2.8-5.2-8.4-8.3-14.1-7.9-3.7.2-5.9 1.1-8.7 3.2z'
      const mouthShape2 = 'M161.2 118.9c0 2.2-1.8 4-4 4s-4-1.8-4-4c0-1 .4-2 1.1-2.7.7-.8 1.8-1.3 2.9-1.3 2.2 0 4 1.7 4 4z'
      const mouthShape4 = 'M149.2 116.7c-4.6 3.7-6.7 8.8-5.2 14.6.1.3.1.5.2.8.6 1.5 2.4 2.3 3.9 1.7l11.2-4.4 11.2-4.4c1.5-.6 2.3-2.4 1.7-3.9-.1-.3-.2-.5-.4-.7-2.8-5.2-8.2-7.2-14-6.9-3.6.2-5.9 1.1-8.6 3.2z'

      const lettersSideLight = '#6D28D9'
      const lettersSideDark = '#2E1065'
      const lettersFrontLight = '#A78BFA'
      const lettersFrontDark = '#2E1065'
      const lettersStrokeLight = '#4C1D95'
      const lettersStrokeDark = '#1A0633'
      const furLightColor = '#FFF'
      const furDarkColor = '#A78BFA'
      const skinLightColor = '#EDE9FE'
      const skinDarkColor = '#C4B5FD'

      function goDark() {
        TweenMax.set('#light', { visibility: 'hidden' })
        TweenMax.set('.lettersSide', { fill: lettersSideDark, stroke: lettersStrokeDark })
        TweenMax.set('.lettersFront', { fill: lettersFrontDark, stroke: lettersStrokeDark })
        TweenMax.set('#lettersShadow', { opacity: 0.05 })
        TweenMax.set('.hlFur', { fill: furDarkColor })
        TweenMax.set('.hlSkin', { fill: skinDarkColor })
      }

      function goLight() {
        TweenMax.set('#light', { visibility: 'visible' })
        TweenMax.set('.lettersSide', { fill: lettersSideLight, stroke: lettersStrokeLight })
        TweenMax.set('.lettersFront', { fill: lettersFrontLight, stroke: lettersStrokeLight })
        TweenMax.set('#lettersShadow', { opacity: 0.2 })
        TweenMax.set('.hlFur', { fill: furLightColor })
        TweenMax.set('.hlSkin', { fill: skinLightColor })
      }

      const chatterTL = new TimelineMax({ paused: true, repeat: -1, yoyo: true })
      chatterTL
        .to(['#mouthBG', '#mouthPath', '#mouthOutline'], 0.1, { morphSVG: mouthShape4 }, '0')
        .to('#chin', 0.1, { y: 1.5 }, '0')

      const yetiTL = new TimelineMax({ paused: true, repeat: -1, repeatDelay: 0, delay: 0 })
      yetiTL
        .call(() => { chatterTL.play() }, null, '0')

        .to(['#armL', '#flashlightFront'], 0.075, { x: 7 }, '2.5')
        .to(['#armL', '#flashlightFront'], 0.075, { x: 0 }, '2.575')
        .to(['#armL', '#flashlightFront'], 0.075, { x: 7 }, '2.65')
        .to(['#armL', '#flashlightFront'], 0.075, { x: 0 }, '2.725')
        .to(['#armL', '#flashlightFront'], 0.075, { x: 7 }, '2.8')
        .to(['#armL', '#flashlightFront'], 0.075, { x: 0 }, '2.875')

        .call(goLight, null, '3.2')
        .call(goDark, null, '3.3')
        .call(goLight, null, '3.4')

        .call(() => {
          chatterTL.pause()
          TweenMax.to(['#mouthBG', '#mouthPath', '#mouthOutline'], 0.1, { morphSVG: mouthShape1 }, '0')
        }, null, '3.2')

        .to(['#mouthBG', '#mouthPath', '#mouthOutline'], 0.25, { morphSVG: mouthShape2 }, '5')
        .to('#tooth1', 0.1, { y: -5 }, '5')
        .to('#armR', 0.5, { x: 10, y: 30, rotation: 10, transformOrigin: 'bottom center', ease: Quad.easeOut }, '4')
        .to(['#eyeL', '#eyeR'], 0.25, { scaleX: 1.4, scaleY: 1.4, transformOrigin: 'center center' }, '5')

        .call(goDark, null, '8')
        .call(goLight, null, '8.1')
        .call(goDark, null, '8.3')
        .call(goLight, null, '8.4')
        .call(goDark, null, '8.6')

        .to(['#mouthBG', '#mouthPath', '#mouthOutline'], 0.25, { morphSVG: mouthShape1 }, '9')
        .to('#tooth1', 0.1, { y: 0 }, '9')
        .to('#armR', 0.5, { x: 0, y: 0, rotation: 0, transformOrigin: 'bottom center', ease: Quad.easeOut }, '9')
        .to(['#eyeL', '#eyeR'], 0.25, { scaleX: 1, scaleY: 1, transformOrigin: 'center center' }, '9')
        .call(() => { chatterTL.play() }, null, '9.25')

        .to(['#armL', '#flashlightFront'], 0.075, { x: 7 }, '11.5')
        .to(['#armL', '#flashlightFront'], 0.075, { x: 0 }, '11.575')
        .to(['#armL', '#flashlightFront'], 0.075, { x: 7 }, '11.65')
        .to(['#armL', '#flashlightFront'], 0.075, { x: 0 }, '11.725')
        .to(['#armL', '#flashlightFront'], 0.075, { x: 7 }, '11.8')
        .to(['#armL', '#flashlightFront'], 0.075, { x: 0 }, '11.875')

      // Silence the "unused" lint for the legacy Linear easing import that the
      // original timeline referenced; keep it available for parity.
      void Linear

      goDark()
      yetiTL.play()

      timelines.push(chatterTL, yetiTL)
    }

    runAnimation().catch((err) => {
      console.error('Failed to load the 404 animation:', err)
    })

    return () => {
      cancelled = true
      timelines.forEach((tl) => tl.kill())
    }
  }, [])

  return (
    <div className="notfound-page" ref={rootRef}>
      <div className="stage" dangerouslySetInnerHTML={{ __html: sceneHtml }} />
      <div className="content">
        <h3>{title}</h3>
        <p>{message}</p>
        <Link className="home-link" to={homeTo}>{homeLabel}</Link>
      </div>
    </div>
  )
}
