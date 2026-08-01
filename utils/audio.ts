
// Synthétiseur Web Audio API pour garantie sonore locale 100% sans dépendance externe
const playSynthChime = (notes: number[], durations: number[]) => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    let startTime = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + durations[idx]);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + durations[idx]);
      startTime += durations[idx] * 0.7;
    });
  } catch (e) {
    console.warn("Web Audio API not supported or blocked", e);
  }
};

export const playSound = (type: 'pop' | 'success' | 'cash' | 'notification' | 'delivery') => {
  let audioSrc = '';
  
  // Vibration Android (Haptic Feedback)
  if ('vibrate' in navigator) {
    if (type === 'pop') navigator.vibrate(20);
    if (type === 'success') navigator.vibrate([40, 60, 40]);
    if (type === 'cash') navigator.vibrate([100, 50, 100, 50, 150]);
    if (type === 'notification') navigator.vibrate([200, 100, 200, 100, 300]);
    if (type === 'delivery') navigator.vibrate([80, 40, 80]);
  }

  // Jouer carillon Web Audio synthétique garanti
  if (type === 'notification') {
    // Carillon 3 tons (Do5 - Mi5 - Sol5 - Do6)
    playSynthChime([523.25, 659.25, 783.99, 1046.50], [0.15, 0.15, 0.15, 0.4]);
  } else if (type === 'cash' || type === 'success') {
    // Carillon joyeux de confirmation
    playSynthChime([587.33, 880.00, 1174.66], [0.12, 0.12, 0.35]);
  }

  switch (type) {
    case 'pop':
      audioSrc = 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3';
      break;
    case 'success':
      audioSrc = 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3';
      break;
    case 'cash':
      audioSrc = 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3';
      break;
    case 'notification':
      audioSrc = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
      break;
    case 'delivery':
      audioSrc = 'https://assets.mixkit.co/active_storage/sfx/1487/1487-preview.mp3';
      break;
  }

  try {
    const audio = new Audio(audioSrc);
    audio.volume = 0.4;
    audio.play().catch(() => {});
  } catch (e) {
    console.error("Audio error", e);
  }
};

