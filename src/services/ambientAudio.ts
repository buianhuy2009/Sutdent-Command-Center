// Ambient Audio Service (Web Audio API Synthesizer)
// Provides zero-dependency, infinite-loop ambient soundscapes for focus and study.

export type TrackId =
  | 'none'
  | 'rain'
  | 'brown'
  | 'pink'
  | 'white'
  | 'binaural'
  | 'waves'
  | 'lofi'
  | 'wind'
  | 'space'
  | 'singingbowl'
  | 'stream'
  | 'campfire';

export interface AmbientTrack {
  id: TrackId;
  label: string;
  shortLabel: string;
  iconName: string;
}

export const AMBIENT_TRACKS: AmbientTrack[] = [
  { id: 'none', label: 'No Music', shortLabel: 'No Music', iconName: 'VolumeX' },
  { id: 'rain', label: 'Rainstorm', shortLabel: '🌧️ Rainstorm', iconName: 'CloudRain' },
  { id: 'brown', label: 'Brown Noise (Deep Focus)', shortLabel: '🟤 Brown Noise', iconName: 'Radio' },
  { id: 'pink', label: 'Pink Noise', shortLabel: '🌸 Pink Noise', iconName: 'Waves' },
  { id: 'white', label: 'White Noise', shortLabel: '⚡ White Noise', iconName: 'Zap' },
  { id: 'binaural', label: '40Hz Binaural Beats', shortLabel: '🧠 40Hz Binaural', iconName: 'Brain' },
  { id: 'waves', label: 'Ocean Tide', shortLabel: '🌊 Ocean Waves', iconName: 'Waves' },
  { id: 'lofi', label: 'Lofi Ambient Pad', shortLabel: '🎵 Lofi Pad', iconName: 'Music' },
  { id: 'wind', label: 'Forest Wind', shortLabel: '🍃 Forest Wind', iconName: 'Wind' },
  { id: 'space', label: 'Cosmic Focus Drone', shortLabel: '🌌 Cosmic Drone', iconName: 'Sparkles' },
  { id: 'singingbowl', label: '432Hz Zen Bowl', shortLabel: '🔔 432Hz Zen Bowl', iconName: 'Bell' },
  { id: 'stream', label: 'Mountain Stream', shortLabel: '💧 Mountain Stream', iconName: 'Droplets' },
  { id: 'campfire', label: 'Cozy Campfire', shortLabel: '🔥 Cozy Campfire', iconName: 'Flame' },
];

type AudioListener = (currentTrack: TrackId) => void;

class AmbientAudioEngine {
  private currentTrack: TrackId = 'none';
  private audioCtx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private activeSources: any[] = [];
  private listeners: Set<AudioListener> = new Set();
  private volume: number = 0.5;

  public getTrack(): TrackId {
    return this.currentTrack;
  }

  public getTrackInfo(): AmbientTrack {
    return (
      AMBIENT_TRACKS.find((t) => t.id === this.currentTrack) || AMBIENT_TRACKS[0]
    );
  }

  public subscribe(listener: AudioListener): () => void {
    this.listeners.add(listener);
    listener(this.currentTrack);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.currentTrack));
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
  }

  public stop() {
    this.activeSources.forEach((node) => {
      try {
        node.stop?.();
        node.disconnect?.();
      } catch {}
    });
    this.activeSources = [];
    this.currentTrack = 'none';
    this.notify();
  }

  public cycleTrack(): TrackId {
    const currentIndex = AMBIENT_TRACKS.findIndex((t) => t.id === this.currentTrack);
    const nextIndex = (currentIndex + 1) % AMBIENT_TRACKS.length;
    const nextTrack = AMBIENT_TRACKS[nextIndex].id;
    this.playTrack(nextTrack);
    return nextTrack;
  }

  public playTrack(type: TrackId) {
    this.stop();
    if (type === 'none') {
      return;
    }

    try {
      const AudioCtxClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
      }
      const ctx = this.audioCtx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const gain = ctx.createGain();
      gain.gain.value = this.volume;
      gain.connect(ctx.destination);
      this.gainNode = gain;

      switch (type) {
        case 'brown': {
          const bufferSize = 3 * ctx.sampleRate;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          let lastOut = 0.0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            lastOut = (lastOut + 0.02 * white) / 1.02;
            output[i] = lastOut * 3.2;
          }
          const src = ctx.createBufferSource();
          src.buffer = noiseBuffer;
          src.loop = true;
          const lowpass = ctx.createBiquadFilter();
          lowpass.type = 'lowpass';
          lowpass.frequency.value = 320;
          src.connect(lowpass);
          lowpass.connect(gain);
          src.start();
          this.activeSources.push(src);
          break;
        }

        case 'rain': {
          const bufferSize = 4 * ctx.sampleRate;
          const rainBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = rainBuffer.getChannelData(0);
          let b0 = 0, b1 = 0, b2 = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99765 * b0 + white * 0.099046;
            b1 = 0.963 * b1 + white * 0.2965164;
            b2 = 0.57 * b2 + white * 1.0526913;
            let sample = (b0 + b1 + b2 + white * 0.1848) * 0.18;
            if (Math.random() < 0.012) {
              sample += (Math.random() * 2 - 1) * 0.5;
            }
            output[i] = sample;
          }
          const src = ctx.createBufferSource();
          src.buffer = rainBuffer;
          src.loop = true;
          const bandpass = ctx.createBiquadFilter();
          bandpass.type = 'bandpass';
          bandpass.frequency.value = 1400;
          bandpass.Q.value = 0.6;
          // LFO-Modulated Rain Filter: wind sweeps 0.06-0.09Hz
          const lfo = ctx.createOscillator();
          lfo.type = 'sine';
          lfo.frequency.value = 0.07;
          const lfoGain = ctx.createGain();
          lfoGain.gain.value = 600;
          lfo.connect(lfoGain);
          lfoGain.connect(bandpass.frequency);
          lfo.start();
          // Secondary slow amplitude LFO for storm intensity variation
          const ampLfo = ctx.createOscillator();
          ampLfo.type = 'sine';
          ampLfo.frequency.value = 0.04;
          const ampGain = ctx.createGain();
          ampGain.gain.value = 0.15;
          ampLfo.connect(ampGain);
          ampGain.connect(gain.gain);
          ampLfo.start();
          src.connect(bandpass);
          bandpass.connect(gain);
          src.start();
          this.activeSources.push(src, lfo, ampLfo);
          break;
        }

        case 'pink': {
          const bufferSize = 3 * ctx.sampleRate;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.969 * b2 + white * 0.153852;
            b3 = 0.8665 * b3 + white * 0.3104856;
            b4 = 0.55 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.016898;
            output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
          }
          const src = ctx.createBufferSource();
          src.buffer = noiseBuffer;
          src.loop = true;
          src.connect(gain);
          src.start();
          this.activeSources.push(src);
          break;
        }

        case 'white': {
          const bufferSize = 2 * ctx.sampleRate;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * 0.12;
          }
          const src = ctx.createBufferSource();
          src.buffer = noiseBuffer;
          src.loop = true;
          src.connect(gain);
          src.start();
          this.activeSources.push(src);
          break;
        }

        case 'binaural': {
          const merger = ctx.createChannelMerger(2);
          const oscL = ctx.createOscillator();
          oscL.type = 'sine';
          oscL.frequency.value = 200;
          oscL.connect(merger, 0, 0);

          const oscR = ctx.createOscillator();
          oscR.type = 'sine';
          oscR.frequency.value = 240;
          oscR.connect(merger, 0, 1);

          // Isochronic Tone Modulator: amplitude pulsation synced to breathing (0.125Hz = 8s cycle: 4s inhale/4s exhale)
          const isoGain = ctx.createGain();
          isoGain.gain.value = 1.0;
          merger.connect(isoGain);
          isoGain.connect(gain);
          const isoLfo = ctx.createOscillator();
          isoLfo.type = 'sine';
          isoLfo.frequency.value = 0.125;
          const isoDepth = ctx.createGain();
          isoDepth.gain.value = 0.45;
          isoLfo.connect(isoDepth);
          isoDepth.connect(isoGain.gain);
          isoLfo.start();

          oscL.start();
          oscR.start();
          this.activeSources.push(oscL, oscR, isoLfo);
          break;
        }

        case 'waves': {
          const bufferSize = 4 * ctx.sampleRate;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          let lastOut = 0.0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            lastOut = (lastOut + 0.02 * white) / 1.02;
            output[i] = lastOut * 2.5;
          }
          const src = ctx.createBufferSource();
          src.buffer = noiseBuffer;
          src.loop = true;

          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 400;

          const lfo = ctx.createOscillator();
          lfo.frequency.value = 0.08;
          const lfoGain = ctx.createGain();
          lfoGain.gain.value = 250;
          lfo.connect(lfoGain);
          lfoGain.connect(filter.frequency);

          src.connect(filter);
          filter.connect(gain);
          src.start();
          lfo.start();
          this.activeSources.push(src, lfo);
          break;
        }

        case 'lofi': {
          const freqs = [130.81, 164.81, 196.0, 246.94];
          freqs.forEach((f) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = f;

            const subGain = ctx.createGain();
            subGain.gain.value = 0.08;

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 450;

            osc.connect(filter);
            filter.connect(subGain);
            subGain.connect(gain);
            osc.start();
            this.activeSources.push(osc);
          });
          break;
        }

        case 'wind': {
          const bufferSize = 3 * ctx.sampleRate;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * 0.15;
          }
          const src = ctx.createBufferSource();
          src.buffer = noiseBuffer;
          src.loop = true;

          const bandpass = ctx.createBiquadFilter();
          bandpass.type = 'bandpass';
          bandpass.frequency.value = 600;
          bandpass.Q.value = 3.0;

          const lfo = ctx.createOscillator();
          lfo.frequency.value = 0.15;
          const lfoGain = ctx.createGain();
          lfoGain.gain.value = 400;
          lfo.connect(lfoGain);
          lfoGain.connect(bandpass.frequency);

          src.connect(bandpass);
          bandpass.connect(gain);
          src.start();
          lfo.start();
          this.activeSources.push(src, lfo);
          break;
        }

        case 'space': {
          [54, 108, 216].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;

            const subGain = ctx.createGain();
            subGain.gain.value = 0.15 / (idx + 1);

            osc.connect(subGain);
            subGain.connect(gain);
            osc.start();
            this.activeSources.push(osc);
          });
          break;
        }

        case 'singingbowl': {
          [432, 864, 1296].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;

            const subGain = ctx.createGain();
            subGain.gain.value = 0.12 / (idx * 1.5 + 1);

            osc.connect(subGain);
            subGain.connect(gain);
            osc.start();
            this.activeSources.push(osc);
          });
          break;
        }

        case 'stream': {
          const bufferSize = 3 * ctx.sampleRate;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * 0.18;
          }
          const src = ctx.createBufferSource();
          src.buffer = noiseBuffer;
          src.loop = true;

          const highpass = ctx.createBiquadFilter();
          highpass.type = 'highpass';
          highpass.frequency.value = 1800;

          src.connect(highpass);
          highpass.connect(gain);
          src.start();
          this.activeSources.push(src);
          break;
        }

        case 'campfire': {
          const bufferSize = 3 * ctx.sampleRate;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          let lastOut = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            lastOut = (lastOut + 0.02 * white) / 1.02;
            let sample = lastOut * 2.0;
            if (Math.random() < 0.003) {
              sample += (Math.random() > 0.5 ? 1 : -1) * 0.8;
            }
            output[i] = sample;
          }
          const src = ctx.createBufferSource();
          src.buffer = noiseBuffer;
          src.loop = true;
          const lowpass = ctx.createBiquadFilter();
          lowpass.type = 'lowpass';
          lowpass.frequency.value = 500;
          src.connect(lowpass);
          lowpass.connect(gain);
          src.start();
          this.activeSources.push(src);
          break;
        }

        default:
          break;
      }

      this.currentTrack = type;
      this.notify();
    } catch (err) {
      console.error('Failed to start ambient audio:', err);
    }
  }
}

export const ambientAudio = new AmbientAudioEngine();
