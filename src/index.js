'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = SimpleVad;

var _vad = require('./lib/vad');

var _vad2 = _interopRequireDefault(_vad);

var _fft = require('./lib/fft');

var _fft2 = _interopRequireDefault(_fft);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function SimpleVad(options) {
  this.vad = new _vad2.default(options);
  this.options = this.vad.options;
  const { fftSize, bufferSize, smoothingTimeConstant } = this.vad.options;
  this.fft = new _fft2.default(fftSize, bufferSize, smoothingTimeConstant);

  this.predict = floatPcmBuffer => {
    this.fft.capture(floatPcmBuffer);
    const floatFrequencyData = this.fft.getFloatFrequencyData();
    const { vadClass } = this.vad.processFrequencyData(floatFrequencyData);
    return { vadClass };
  };

  return {
    options: this.options,
    predict: this.predict
  };
}