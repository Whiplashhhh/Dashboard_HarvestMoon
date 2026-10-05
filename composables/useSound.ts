/**
 * Petits retours sonores synthétisés en WebAudio (aucun fichier audio).
 * Désactivés par défaut ; activables dans les Réglages.
 */
type SoundName = 'pop' | 'ding' | 'tick' | 'fanfare'

let context: AudioContext | null = null

function audio(): AudioContext | null {
  if (!import.meta.client) return null
  if (!context) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    context = new Ctor()
  }
  if (context.state === 'suspended') void context.resume()
  return context
}

function tone(
  ctx: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  type: OscillatorType,
  volume = 0.12,
) {
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + start)
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + start)
  gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + start + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration)
  oscillator.connect(gain).connect(ctx.destination)
  oscillator.start(ctx.currentTime + start)
  oscillator.stop(ctx.currentTime + start + duration + 0.02)
  return oscillator
}

export function playSound(name: SoundName) {
  const ctx = audio()
  if (!ctx) return
  switch (name) {
    case 'pop': {
      const osc = tone(ctx, 520, 0, 0.09, 'triangle', 0.1)
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.06)
      break
    }
    case 'tick':
      tone(ctx, 1200, 0, 0.03, 'square', 0.03)
      break
    case 'ding':
      tone(ctx, 1046.5, 0, 0.35, 'sine', 0.12)
      tone(ctx, 1568, 0.07, 0.4, 'sine', 0.07)
      break
    case 'fanfare':
      ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(ctx, f, i * 0.09, 0.22, 'square', 0.05))
      break
  }
}

export function useSound() {
  const settings = useSettings()
  return {
    play(name: SoundName) {
      if (settings.value.sounds) playSound(name)
    },
  }
}
