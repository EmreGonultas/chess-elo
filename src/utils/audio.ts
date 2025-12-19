// Simple turn notification sound - single beep tone
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

export function playTurnSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Pleasant notification tone (E note, 659Hz)
    oscillator.frequency.value = 659.25;
    oscillator.type = 'sine';

    // Fade in/out for smooth sound
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.15);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
}
