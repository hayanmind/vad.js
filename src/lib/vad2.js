'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; // This is voice activity detection based on amplitude.

exports.default = function (options) {
  var _this = this;

  // Default options
  this.options = {
    minAmplitude: 0.2,
    voiceTrendMax: 3,
    voiceTrendMin: 0,
    voiceTrendStart: 3,
    voiceTrendEnd: 0
  };

  // User options
  this.options = _extends({}, this.options, options);

  this.vadState = false; // True when Voice Activity Detected
  this.voiceTrend = 0;

  this.getAmplitude = function (pcmData) {
    return Math.max.apply(Math, _toConsumableArray(pcmData));
  };

  this.detectVoiceActivity = function (pcmData) {
    var _options = _this.options,
        voiceTrendStart = _options.voiceTrendStart,
        voiceTrendEnd = _options.voiceTrendEnd,
        voiceTrendMax = _options.voiceTrendMax,
        voiceTrendMin = _options.voiceTrendMin,
        minAmplitude = _options.minAmplitude;

    var amplitude = _this.getAmplitude(pcmData);

    if (amplitude > minAmplitude) {
      _this.voiceTrend = _this.voiceTrend + 1 > voiceTrendMax ? voiceTrendMax : _this.voiceTrend + 1;
    } else {
      _this.voiceTrend = _this.voiceTrend - 1 < voiceTrendMin ? voiceTrendMin : _this.voiceTrend - 1;
    }

    var start = false;
    var end = false;

    if (_this.voiceTrend >= voiceTrendStart) {
      // Start of speech detected
      start = true;
    } else if (_this.voiceTrend <= voiceTrendEnd) {
      // End of speech detected
      end = true;
    }

    // Broadcast the messages
    if (start && !_this.vadState) {
      _this.vadState = true;
    }
    if (end && _this.vadState) {
      _this.vadState = false;
    }

    return {
      vadClass: _this.vadState ? 'voiced' : 'unvoiced',
      voiceTrend: _this.voiceTrend,
      amplitude: amplitude
    };
  };

  return {
    options: this.options,
    detectVoiceActivity: this.detectVoiceActivity
  };
};

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }