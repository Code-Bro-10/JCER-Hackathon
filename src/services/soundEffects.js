/**
 * Web Audio API synthesizer for alert feedback and emergency sirens
 * Gracefully silent if user has not interacted or browser disables audio
 */

class SoundEffectsService {
  constructor() {
    this.ctx = null
    this.muted = false
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
  }

  playClick() {
    if (this.muted) return
    try {
      this.init()
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(800, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05)
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.05)
    } catch {
      // Ignore audio autoplay restrictions
    }
  }

  playSuccess() {
    if (this.muted) return
    try {
      this.init()
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime) // C5
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.08) // E5
      osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.16) // G5
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.28)
    } catch {
      // Ignore
    }
  }

  playEmergencySiren() {
    if (this.muted) return
    try {
      this.init()
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(700, this.ctx.currentTime)
      osc.frequency.linearRampToValueAtTime(950, this.ctx.currentTime + 0.18)
      osc.frequency.linearRampToValueAtTime(700, this.ctx.currentTime + 0.36)
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.4)
    } catch {
      // Ignore
    }
  }

  toggleMute() {
    this.muted = !this.muted
    return this.muted
  }
}

export const sounds = new SoundEffectsService()

