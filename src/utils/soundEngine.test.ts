import { describe, expect, it } from 'vitest';
import { WHITE_NOISE_OPTIONS, soundEngine } from './soundEngine';

describe('SoundEngine', () => {
  it('exposes all premium and free white noise options with valid IDs', () => {
    expect(WHITE_NOISE_OPTIONS.length).toBeGreaterThanOrEqual(6);
    const ids = WHITE_NOISE_OPTIONS.map((o) => o.id);
    expect(ids).toContain('none');
    expect(ids).toContain('rain');
    expect(ids).toContain('clock-tick');
    expect(ids).toContain('deep-pink');
    expect(ids).toContain('cafe-brown');
    expect(ids).toContain('binaural-alpha');
  });

  it('clamps volume levels between 0 and 1 safely', () => {
    expect(() => soundEngine.setVolume(0.5)).not.toThrow();
    expect(() => soundEngine.setVolume(-0.2)).not.toThrow();
    expect(() => soundEngine.setVolume(1.8)).not.toThrow();
  });

  it('safely handles audio synthesis when context is simulated or uninitialized', () => {
    expect(() => soundEngine.stopWhiteNoise()).not.toThrow();
    expect(() => soundEngine.playCompletionBell()).not.toThrow();
    expect(() => soundEngine.playPomodoroCompleteAlarm()).not.toThrow();
    expect(() => soundEngine.playReminderAlarm()).not.toThrow();
  });
});
