import { getGlobalSettings } from "../services/firebaseService";

/**
 * Play a high-quality, elegant, and premium success sound effect (cha-ching/success chime)
 * meticulously synthesized on-the-fly using the Web Audio API.
 * This ensures lightning-fast performance, zero external asset dependencies, 
 * and perfect compatibility across modern desktop and mobile browsers.
 */
export async function playSuccessSound() {
  try {
    const settings = await getGlobalSettings();
    // Default to true (active) if the setting hasn't been explicitly configured yet
    if (settings && settings.sound_notifications_active === false) {
      return; 
    }
  } catch (error) {
    console.error("Failed to read sound notification settings, playing by default:", error);
  }

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Master volume set to 0.16 (pleasant and solid level)
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.16, now);
    masterGain.connect(ctx.destination);

    // ==========================================
    // 1. THE CASH REGISTER BELL (High metal strike)
    // ==========================================
    // Primary bell tone
    const bell1 = ctx.createOscillator();
    const bell1Gain = ctx.createGain();
    bell1.type = "sine";
    bell1.frequency.setValueAtTime(1250, now); // Metallic chime frequency
    bell1Gain.gain.setValueAtTime(0.45, now);
    bell1Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    bell1.connect(bell1Gain);
    bell1Gain.connect(masterGain);

    // High octave harmonic bell tone for metallic sizzle
    const bell2 = ctx.createOscillator();
    const bell2Gain = ctx.createGain();
    bell2.type = "triangle";
    bell2.frequency.setValueAtTime(2500, now);
    bell2Gain.gain.setValueAtTime(0.18, now);
    bell2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    bell2.connect(bell2Gain);
    bell2Gain.connect(masterGain);

    // ==========================================
    // 2. STAGGERED COIN CLATTER (Chinking money)
    // ==========================================
    const coinTimes = [0.06, 0.11, 0.15, 0.20, 0.24];
    const coinFreqs = [1900, 2900, 4200, 3100, 5200];
    
    coinTimes.forEach((timeOffset, idx) => {
      const coinOsc = ctx.createOscillator();
      const coinGain = ctx.createGain();
      
      coinOsc.type = "sine";
      coinOsc.frequency.setValueAtTime(coinFreqs[idx], now + timeOffset);
      
      coinGain.gain.setValueAtTime(0, now + timeOffset);
      coinGain.gain.linearRampToValueAtTime(0.3, now + timeOffset + 0.005);
      coinGain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.07);
      
      coinOsc.connect(coinGain);
      coinGain.connect(masterGain);
      
      coinOsc.start(now + timeOffset);
      coinOsc.stop(now + timeOffset + 0.09);
    });

    // ==========================================
    // 3. WHITE NOISE RESONANCE FOR COIN FRICTION
    // ==========================================
    const bufferSize = ctx.sampleRate * 0.22; // ~220ms duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      channelData[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    // Filter to isolate the high-pitched "clink" frequencies (bandpass around 7500Hz)
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(7500, now);
    noiseFilter.Q.value = 4.0;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.2, now + 0.05);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);

    // Starting audio nodes
    bell1.start(now);
    bell1.stop(now + 0.4);

    bell2.start(now);
    bell2.stop(now + 0.2);

    noiseSource.start(now + 0.02);
    noiseSource.stop(now + 0.25);

  } catch (err) {
    console.error("Audio Synthesis error:", err);
  }
}
