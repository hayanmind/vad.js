'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (fftSize, bufferSize, smoothingTimeConstant) {
  this.fftSize = fftSize;
  this.bufferSize = bufferSize;
  this.smoothingTimeConstant = smoothingTimeConstant;

  this.frequencyBinCount = this.fftSize / 2;
  this.fftCount = 0;
  this.data = [];
  this.fdata = new Float32Array(this.fftSize);

  const self = this;

  this.capture = pcmBuffer => {
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
        input[i] *= (0, _blackman2.default)(i, self.fftSize);
      }

      // create complex parts
      const inputRe = (0, _ndarray2.default)(input);
      const inputIm = (0, _ndarray2.default)(new Float32Array(self.fftSize));

      // do fast fourier transform
      (0, _ndarrayFft2.default)(1, inputRe, inputIm);

      // apply smoothing factor
      const k = Math.min(1, Math.max(self.smoothingTimeConstant, 0));

      for (let i = 0; i < self.fftSize; i += 1) {
        self.fdata[i] = k * self.fdata[i] + (1 - k) * (Math.sqrt(Math.pow(inputRe.get(i), 2) + Math.pow(inputIm.get(i), 2)) / fftSize);
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
    getFloatFrequencyData: this.getFloatFrequencyData
  };
};

var _ndarray = require('ndarray');

var _ndarray2 = _interopRequireDefault(_ndarray);

var _blackman = require('scijs-window-functions/blackman');

var _blackman2 = _interopRequireDefault(_blackman);

var _ndarrayFft = require('ndarray-fft');

var _ndarrayFft2 = _interopRequireDefault(_ndarrayFft);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }