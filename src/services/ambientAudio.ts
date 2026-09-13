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
  { id: 'rain', label: 'Gentle Fingerpicking', shortLabel: '🎸 Gentle Picking', iconName: 'CloudRain' },
  { id: 'brown', label: 'Music-Box Lullaby', shortLabel: '🎠 Music Box', iconName: 'Radio' },
  { id: 'pink', label: 'Warm String Drone', shortLabel: '🎻 String Drone', iconName: 'Waves' },
  { id: 'white', label: 'Soft Piano Arpeggio', shortLabel: '🎹 Piano Arp', iconName: 'Zap' },
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
          // Gentle music-box melody loop: C-major pentatonic lullaby (sine + shimmer harmonic).
          const master = ctx.createGain();
          master.gain.value = 0.6;
          master.connect(gain);
          const melody = [
            659.25, 783.99, 1046.5, 987.77, 880.0, 783.99, 659.25, 587.33,
            523.25, 587.33, 659.25, 783.99, 880.0, 783.99, 659.25, 523.25,
          ];
          let idx = 0;
          const playBoxNote = (freq: number) => {
            const t = ctx.currentTime;
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const shimmer = ctx.createOscillator();
            shimmer.type = 'sine';
            shimmer.frequency.value = freq * 3;
            const shimmerGain = ctx.createGain();
            shimmerGain.gain.value = 0.06;
            const env = ctx.createGain();
            env.gain.setValueAtTime(0.0001, t);
            env.gain.linearRampToValueAtTime(0.3, t + 0.01);
            env.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
            osc.connect(env);
            shimmer.connect(shimmerGain);
            shimmerGain.connect(env);
            env.connect(master);
            osc.start(t);
            osc.stop(t + 2.4);
            shimmer.start(t);
            shimmer.stop(t + 2.4);
            this.activeSources.push(osc, shimmer);
          };
          const tick = () => {
            playBoxNote(melody[idx % melody.length]);
            idx++;
          };
          tick();
          const timer = window.setInterval(tick, 600);
          this.activeSources.push({
            stop: () => window.clearInterval(timer),
            disconnect: () => {
              try {
                master.disconnect();
              } catch {}
            },
          });
          break;
        }

        case 'rain': {
          // Calm fingerpicked-pluck pattern: C – G – Am – F Travis-style loop (triangle plucks).
          const master = ctx.createGain();
          master.gain.value = 0.6;
          const lowpass = ctx.createBiquadFilter();
          lowpass.type = 'lowpass';
          lowpass.frequency.value = 2200;
          lowpass.connect(master);
          master.connect(gain);
          const progression: number[][] = [
            [130.81, 164.81, 196.0, 246.94],
            [98.0, 146.83, 196.0, 246.94],
            [110.0, 130.81, 164.81, 220.0],
            [87.31, 130.81, 174.61, 220.0],
          ];
          const pattern = [0, 2, 1, 3, 1, 2, 0, 3];
          let step = 0;
          const playPluck = (freq: number, vol: number) => {
            const t = ctx.currentTime;
            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            const env = ctx.createGain();
            env.gain.setValueAtTime(0.0001, t);
            env.gain.linearRampToValueAtTime(vol, t + 0.005);
            env.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
            osc.connect(env);
            env.connect(lowpass);
            osc.start(t);
            osc.stop(t + 1.0);
            this.activeSources.push(osc);
          };
          const tick = () => {
            const chord = progression[Math.floor(step / pattern.length) % progression.length];
            const stringIdx = pattern[step % pattern.length];
            playPluck(chord[stringIdx], stringIdx === 0 ? 0.34 : 0.22);
            step++;
          };
          tick();
          const timer = window.setInterval(tick, 340);
          this.activeSources.push({
            stop: () => window.clearInterval(timer),
            disconnect: () => {
              try {
                lowpass.disconnect();
              } catch {}
              try {
                master.disconnect();
              } catch {}
            },
          });
          break;
        }

        case 'pink': {
          // Warm string drone with slow attack: A-major pad (sawtooth stack through breathing lowpass).
          const droneGain = ctx.createGain();
          droneGain.gain.setValueAtTime(0.0001, ctx.currentTime);
          droneGain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 4.0);
          const lowpass = ctx.createBiquadFilter();
          lowpass.type = 'lowpass';
          lowpass.frequency.value = 750;
          lowpass.Q.value = 0.5;
          lowpass.connect(droneGain);
          droneGain.connect(gain);
          const filterLfo = ctx.createOscillator();
          filterLfo.type = 'sine';
          filterLfo.frequency.value = 0.06;
          const filterAmt = ctx.createGain();
          filterAmt.gain.value = 280;
          filterLfo.connect(filterAmt);
          filterAmt.connect(lowpass.frequency);
          filterLfo.start();
          const breath = ctx.createOscillator();
          breath.type = 'sine';
          breath.frequency.value = 0.09;
          const breathAmt = ctx.createGain();
          breathAmt.gain.value = 0.12;
          breath.connect(breathAmt);
          breathAmt.connect(droneGain.gain);
          breath.start();
          [110.0, 164.81, 220.0, 277.18, 329.63].forEach((f, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = f;
            osc.detune.value = i % 2 === 0 ? 4 : -4;
            const voiceGain = ctx.createGain();
            voiceGain.gain.value = 0.08;
            osc.connect(voiceGain);
            voiceGain.connect(lowpass);
            osc.start();
            this.activeSources.push(osc);
          });
          this.activeSources.push(filterLfo, breath);
          break;
        }

        case 'white': {
          // Soft piano-ish pad arpeggio: Cmaj7 – Am7 – Fmaj7 – G6 loop (triangle + lowpass).
          const master = ctx.createGain();
          master.gain.value = 0.55;
          const lowpass = ctx.createBiquadFilter();
          lowpass.type = 'lowpass';
          lowpass.frequency.value = 1600;
          lowpass.connect(master);
          master.connect(gain);
          const chords: number[][] = [
            [130.81, 164.81, 196.0, 246.94, 293.66],
            [110.0, 130.81, 164.81, 196.0, 246.94],
            [87.31, 110.0, 130.81, 164.81, 220.0],
            [98.0, 123.47, 146.83, 196.0, 246.94],
          ];
          let step = 0;
          const playKeysNote = (freq: number) => {
            const t = ctx.currentTime;
            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            const env = ctx.createGain();
            env.gain.setValueAtTime(0.0001, t);
            env.gain.linearRampToValueAtTime(0.32, t + 0.02);
            env.gain.exponentialRampToValueAtTime(0.0001, t + 1.9);
            osc.connect(env);
            env.connect(lowpass);
            osc.start(t);
            osc.stop(t + 2.0);
            this.activeSources.push(osc);
          };
          const tick = () => {
            const chord = chords[Math.floor(step / 5) % chords.length];
            playKeysNote(chord[step % chord.length]);
            step++;
          };
          tick();
          const timer = window.setInterval(tick, 520);
          this.activeSources.push({
            stop: () => window.clearInterval(timer),
            disconnect: () => {
              try {
                lowpass.disconnect();
              } catch {}
              try {
                master.disconnect();
              } catch {}
            },
          });
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
