
export const playSound = (type: 'pop' | 'success' | 'cash' | 'notification' | 'delivery') => {
  let audioSrc = '';
  
  // Vibration Android (Haptic Feedback) - Indispensable pour l'effet "Application"
  if ('vibrate' in navigator) {
    if (type === 'pop') navigator.vibrate(15);
    if (type === 'success' || type === 'cash') navigator.vibrate([30, 50, 30]);
    if (type === 'notification') navigator.vibrate(40);
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
    audio.volume = 0.3;
    audio.play().catch(() => {});
  } catch (e) {
    console.error("Audio error", e);
  }
};
