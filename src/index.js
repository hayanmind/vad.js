'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = SimpleVad;

var _vad = require('./lib/vad2');

var _vad2 = _interopRequireDefault(_vad);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function SimpleVad(options) {
  var _this = this;

  this.vad = new _vad2.default(options);
  this.options = this.vad.options;

  this.predict = function (floatPcmBuffer) {
    var resultObject = _this.vad.detectVoiceActivity(floatPcmBuffer);
    return resultObject;
  };

  return {
    options: this.options,
    predict: this.predict
  };
}