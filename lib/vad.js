export default function (options) {
  // Default options
  this.options = {
    fftSize: 512,
    bufferSize: 512,
    smoothingTimeConstant: 0.99,
    energy_offset: 1e-8, // The initial offset.
    energy_threshold_ratio_pos: 2, // Signal must be twice the offset
    energy_threshold_ratio_neg: 0.5, // Signal must be half the offset
    energy_integration: 1, // Size of integration change compared to the signal per second.
    filter: [
      { f: 200, v: 0 }, // 0 -> 200 is 0
      { f: 2000, v: 1 }, // 200 -> 2k is 1
    ],
    sampleRate: 16000,
  };

  // User options
  for (const option in options) {
    if (options.hasOwnProperty(option)) {
      this.options[option] = options[option];
    }
  }

  // Calculate time relationships
  this.hertzPerBin = this.options.sampleRate / this.options.fftSize;
  this.iterationFrequency = this.options.sampleRate / this.options.bufferSize;
  this.iterationPeriod = 1 / this.iterationFrequency;

  const DEBUG = true;
  if (DEBUG) {
    console.log(`Vad | sampleRate: ${this.options.sampleRate} | hertzPerBin: ${this.hertzPerBin} | iterationFrequency: ${this.iterationFrequency} | iterationPeriod: ${this.iterationPeriod}`);
  }

  this.setFilter = function (shape) {
    this.filter = [];
    for (let i = 0, iLen = this.options.fftSize / 2; i < iLen; i += 1) {
      this.filter[i] = 0;
      for (let j = 0, jLen = shape.length; j < jLen; j += 1) {
        if (i * this.hertzPerBin < shape[j].f) {
          this.filter[i] = shape[j].v;
          break; // Exit j loop
        }
      }
    }
  };

  this.setFilter(this.options.filter);

  this.ready = {};
  this.vadState = false; // True when Voice Activity Detected

  // Energy detector props
  this.energy_offset = this.options.energy_offset;
  this.energy_threshold_pos = this.energy_offset * this.options.energy_threshold_ratio_pos;
  this.energy_threshold_neg = this.energy_offset * this.options.energy_threshold_ratio_neg;

  this.voiceTrend = 0;
  this.voiceTrendMax = 10;
  this.voiceTrendMin = -10;
  this.voiceTrendStart = 5;
  this.voiceTrendEnd = -5;

  const frequencyBinCount = this.options.fftSize / 2;
  this.floatFrequencyData = new Float32Array(frequencyBinCount);

  // Setup local storage of the Linear FFT data
  this.floatFrequencyDataLinear = new Float32Array(this.floatFrequencyData.length);

  const self = this;
  this.processFrequencyData = function (floatFrequencyData) {
    self.floatFrequencyData = floatFrequencyData;
    self.update();
    const { vadClass, voiceTrend } = self.monitor();
    return { vadClass, voiceTrend };
  };

  this.update = function () {
    // Update the local version of the Linear FFT
    const fft = this.floatFrequencyData;
    for (let i = 0, iLen = fft.length; i < iLen; i += 1) {
      this.floatFrequencyDataLinear[i] = 10 ** (fft[i] / 10);
    }
    this.ready = {};
  };

  this.getEnergy = function () {
    if (this.ready.energy) {
      return this.energy;
    }

    let energy = 0;
    const fft = this.floatFrequencyDataLinear;

    for (let i = 0, iLen = fft.length; i < iLen; i += 1) {
      energy += this.filter[i] * fft[i] * fft[i];
    }

    this.energy = energy;
    this.ready.energy = true;

    return energy;
  };

  this.monitor = function () {
    const energy = this.getEnergy();
    const signal = energy - this.energy_offset;

    if (signal > this.energy_threshold_pos) {
      this.voiceTrend =
        (this.voiceTrend + 1 > this.voiceTrendMax) ? this.voiceTrendMax : this.voiceTrend + 1;
    } else if (signal < -this.energy_threshold_neg) {
      this.voiceTrend =
      (this.voiceTrend - 1 < this.voiceTrendMin) ? this.voiceTrendMin : this.voiceTrend - 1;
    } else {
      // voiceTrend gets smaller
      if (this.voiceTrend > 0) {
        this.voiceTrend -= 1;
      } else if (this.voiceTrend < 0) {
        this.voiceTrend += 1;
      }
    }

    let start = false;
    let end = false;

    if (this.voiceTrend > this.voiceTrendStart) {
      // Start of speech detected
      start = true;
    } else if (this.voiceTrend < this.voiceTrendEnd) {
      // End of speech detected
      end = true;
    }

    // Integration brings in the real-time aspect
    // through the relationship with the frequency this functions is called.
    const integration = signal * this.iterationPeriod * this.options.energy_integration;

    // Idea?: The integration is affected by the voiceTrend magnitude? - Not sure. Not doing atm.

    // The !end limits the offset delta boost till after the end is detected.
    if (integration > 0 || !end) {
      this.energy_offset += integration;
    } else {
      this.energy_offset += integration * 10;
    }
    this.energy_offset = this.energy_offset < 0 ? 0 : this.energy_offset;
    this.energy_threshold_pos = this.energy_offset * this.options.energy_threshold_ratio_pos;
    this.energy_threshold_neg = this.energy_offset * this.options.energy_threshold_ratio_neg;

    // Broadcast the messages
    if (start && !this.vadState) {
      this.vadState = true;
    }
    if (end && this.vadState) {
      this.vadState = false;
    }

    const vadInfo =
      `e: ${energy} | 
      e_of: ${this.energy_offset} | 
      e+_th: ${this.energy_threshold_pos} | 
      e-_th: ${this.energy_threshold_neg} | 
      signal: ${signal} | 
      int: ${integration} | 
      voiceTrend: ${this.voiceTrend} | 
      start: ${start} | 
      end: ${end}`;
    // console.log(vadInfo);

    return { vadClass: this.vadState ? 'voiced' : 'unvoiced', voiceTrend: this.voiceTrend };
  };

  return {
    options: this.options,
    processFrequencyData: this.processFrequencyData,
  };
}
