// https://webaudio.github.io/web-audio-api/#widl-AnalyserNode-maxDecibels

import ndarray from 'ndarray';
import applyWindow from 'scijs-window-functions/blackman';
import fft from 'ndarray-fft';

export default function (fftSize, bufferLen, smoothingTimeConstant) {
  this.fftSize = fftSize;
  this.bufferLen = bufferLen;
  this.smoothingTimeConstant = smoothingTimeConstant;

  this.frequencyBinCount = this.fftSize / 2;
  this.fftCount = 0;
  this.data = [];
  this.fdata = new Float32Array(this.fftSize);

  const self = this;

  this.capture = (pcmBuffer) => {
    const channelData = Array.prototype.slice.call(pcmBuffer);

    // shift data & ensure size
    self.data = self.data.concat(channelData).slice(-self.bufferSize);

    // increase count
    self.fftCount += channelData.length;

    // perform fft, if enough new data
    if (self.fftCount >= self.fftSize) {
      self.fftCount = 0;

      const input = self.data.slice(-self.fftSize);

      // do windowing
      for (let i = 0; i < self.fftSize; i += 1) {
        input[i] *= applyWindow(i, self.fftSize);
      }

      // create complex parts
      const inputRe = ndarray(input);
      const inputIm = ndarray(new Float32Array(self.fftSize));

      // do fast fourier transform
      fft(1, inputRe, inputIm);

      // apply smoothing factor
      const k = Math.min(1, Math.max(self.smoothingTimeConstant, 0));

      for (let i = 0; i < self.fftSize; i += 1) {
        self.fdata[i] =
          (k * self.fdata[i]) +
          ((1 - k) * (Math.sqrt((inputRe.get(i) ** 2) + (inputIm.get(i) ** 2)) / fftSize));
      }
    }
  };

  this.getFloatFrequencyData = (size = self.frequencyBinCount) => {
    // https://stackoverflow.com/questions/26241430/fft-values-of-webaudios-analysernode-are-outside-range

    const floatFrequencyDataLength = Math.min(self.frequencyBinCount, size);
    const floatFrequencyData = new Float32Array(floatFrequencyDataLength);

    for (let i = 0, l = floatFrequencyDataLength; i < l; i += 1) {
      floatFrequencyData[i] = self.db(self.fdata[i]);
    }

    return floatFrequencyData;
  };

  this.db = value => 20.0 * Math.log10(value);

  return {
    capture: this.capture,
    getFloatFrequencyData: this.getFloatFrequencyData,
  };
}
