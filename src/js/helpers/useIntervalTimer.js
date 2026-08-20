import { computed, onUnmounted, ref } from 'vue'

/**
 * A work/rest interval timer.
 *
 * Deliberately driven from absolute deadlines rather than by subtracting a
 * tick each interval: a phone in a pocket throttles timers hard, and an
 * accumulating counter drifts by whole seconds over a ten-minute hangboard
 * session. Comparing against Date.now() means a throttled tab is late to
 * notice a phase ended, never wrong about when it did.
 */
export function useIntervalTimer() {
  const rounds = ref(1)
  const workSeconds = ref(0)
  const restSeconds = ref(0)

  const round = ref(0)
  const phase = ref('idle') // idle | ready | work | rest | done
  const remaining = ref(0)
  const running = ref(false)

  let deadline = 0
  let ticker = null
  let audio = null
  let wakeLock = null

  const READY_SECONDS = 5

  /**
   * Sound has to be unlocked by a gesture on iOS, so the AudioContext is
   * created on the tap that starts the timer and never before. Getting this
   * wrong gives a timer that beeps perfectly in a desktop browser and is
   * silent on the wall — the one place it matters.
   */
  const primeAudio = () => {
    if (audio) {
      if (audio.state === 'suspended') audio.resume()
      return
    }
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (Ctx) audio = new Ctx()
  }

  const beep = (frequency = 880, ms = 140) => {
    // Vibration as well as sound, not instead: a gym is loud, and a phone on
    // a crash pad is often out of earshot but against a leg.
    if (navigator.vibrate) navigator.vibrate(ms)

    if (!audio || audio.state !== 'running') return
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.frequency.value = frequency
    // A short ramp instead of a hard stop: an abrupt cut clicks.
    gain.gain.setValueAtTime(0.001, audio.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.4, audio.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + ms / 1000)
    osc.connect(gain)
    gain.connect(audio.destination)
    osc.start()
    osc.stop(audio.currentTime + ms / 1000)
  }

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen')
    } catch {
      // Denied or unsupported. The timer still works; the screen may sleep.
    }
  }

  const releaseWakeLock = () => {
    // Released on every stop, not only on unmount: a lock left held is a
    // battery draining behind whatever the climber opened next.
    try {
      wakeLock?.release()
    } catch {
      // Already gone.
    }
    wakeLock = null
  }

  // A lock is dropped whenever the page is hidden, and does not come back by
  // itself when the climber returns to it mid-set.
  const onVisibility = () => {
    if (document.visibilityState === 'visible' && running.value && !wakeLock) requestWakeLock()
  }

  const enter = (next, seconds) => {
    phase.value = next
    remaining.value = seconds
    deadline = Date.now() + seconds * 1000
  }

  const advance = () => {
    if (phase.value === 'ready') {
      beep(1320, 220)
      enter('work', workSeconds.value)
      return
    }

    if (phase.value === 'work') {
      // Last round: no rest to serve, the session is over.
      if (round.value >= rounds.value) {
        finish()
        return
      }
      beep(660, 180)
      enter('rest', restSeconds.value)
      return
    }

    if (phase.value === 'rest') {
      round.value += 1
      beep(1320, 220)
      enter('work', workSeconds.value)
    }
  }

  const tick = () => {
    const left = Math.max(0, Math.round((deadline - Date.now()) / 1000))

    // Three counted beeps into a phase change, so a hang starts on a known
    // beat rather than a surprise.
    if (left !== remaining.value && left > 0 && left <= 3) beep(440, 90)

    remaining.value = left
    if (left <= 0) advance()
  }

  const finish = () => {
    phase.value = 'done'
    running.value = false
    remaining.value = 0
    clearInterval(ticker)
    ticker = null
    beep(880, 500)
    releaseWakeLock()
  }

  const start = () => {
    primeAudio()
    requestWakeLock()
    document.addEventListener('visibilitychange', onVisibility)

    round.value = 1
    running.value = true
    // A few seconds to get on the board before the first hang.
    enter('ready', READY_SECONDS)

    clearInterval(ticker)
    // Five times a second: fast enough that the displayed second changes when
    // it should, cheap enough to leave running.
    ticker = setInterval(tick, 200)
  }

  const pause = () => {
    running.value = false
    clearInterval(ticker)
    ticker = null
    releaseWakeLock()
  }

  const resume = () => {
    primeAudio()
    requestWakeLock()
    running.value = true
    deadline = Date.now() + remaining.value * 1000
    ticker = setInterval(tick, 200)
  }

  const reset = () => {
    pause()
    phase.value = 'idle'
    round.value = 0
    remaining.value = 0
  }

  const stop = () => {
    reset()
    document.removeEventListener('visibilitychange', onVisibility)
  }

  onUnmounted(stop)

  const label = computed(() => {
    if (phase.value === 'ready') return 'Get ready'
    if (phase.value === 'work') return 'Hang'
    if (phase.value === 'rest') return 'Rest'
    if (phase.value === 'done') return 'Done'
    return ''
  })

  return {
    rounds, workSeconds, restSeconds,
    round, phase, remaining, running, label,
    start, pause, resume, reset, stop
  }
}
