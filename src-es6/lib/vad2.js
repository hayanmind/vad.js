// This is voice activity detection based on amplitude.

export default function (options) {
  // Default options
  this.options = {
    minAmplitude: 0.2,
    voiceTrendMax: 3,
    voiceTrendMin: 0,
    voiceTrendStart: 3,
    voiceTrendEnd: 0,
  };

  // User options
  this.options = { ...this.options, ...options };

  this.vadState = false; // True when Voice Activity Detected
  this.voiceTrend = 0;

  this.getAmplitude = pcmData => Math.max(...pcmData);

  this.detectVoiceActivity = (pcmData) => {
    const {
      voiceTrendStart,
      voiceTrendEnd,
      voiceTrendMax,
      voiceTrendMin,
      minAmplitude,
    } = this.options;
    const amplitude = this.getAmplitude(pcmData);

    if (amplitude > minAmplitude) {
      this.voiceTrend =
        (this.voiceTrend + 1 > voiceTrendMax) ? voiceTrendMax : this.voiceTrend + 1;
    } else {
      this.voiceTrend =
        (this.voiceTrend - 1 < voiceTrendMin) ? voiceTrendMin : this.voiceTrend - 1;
    }

    let start = false;
    let end = false;

    if (this.voiceTrend >= voiceTrendStart) {
      // Start of speech detected
      start = true;
    } else if (this.voiceTrend <= voiceTrendEnd) {
      // End of speech detected
      end = true;
    }

    // Broadcast the messages
    if (start && !this.vadState) {
      this.vadState = true;
    }
    if (end && this.vadState) {
      this.vadState = false;
    }

    return {
      vadClass: this.vadState ? 'voiced' : 'unvoiced',
      voiceTrend: this.voiceTrend,
      amplitude,
    };
  };

  return {
    options: this.options,
    detectVoiceActivity: this.detectVoiceActivity,
  };
}
