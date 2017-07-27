// https://webaudio.github.io/web-audio-api/#widl-AnalyserNode-maxDecibels

import VAD from './lib/vad';
import AV from 'av';

var fft = require('ndarray-fft');
var blackman = require('scijs-window-functions/blackman');
var ndarray = require('ndarray');
var db = require('decibels/from-gain');

const { FFT } = require('jsfft');

const applyWindow = blackman;
const audioFileAsset = AV.Asset.fromFile("./micro-doc.wav");

audioFileAsset.get('format', (format) => {
    console.log(format);
    const vadObject = new VAD({
        sampleRate: format.sampleRate,
        energy_threshold_ratio_pos: 1.5,
		energy_threshold_ratio_neg: 0.75,
		energy_integration: 0.75,
		filter: [{f: 100000, v:1}] // no filter
    });

    console.log('hi');
    console.log(vadObject);

    let _fftCount = 0;
    let _data = [];
    let _fdata = new Float32Array(vadObject.options.fftSize);
    let prevVadClass = '';

    audioFileAsset.decodeToBuffer((buffer) => {
        for (let i=0; i<buffer.length; i=i+vadObject.options.bufferLen) {
            const pcmBuffer = buffer.slice(i, i+vadObject.options.bufferLen);

            _data, _fdata = _capture(
                pcmBuffer, // Float32Array
                _data,
                _fdata,
                _fftCount,
                vadObject.options.fftSize,
                vadObject.options.bufferLen,
                vadObject.options.smoothingTimeConstant,
            )

            const frequencyBinCount = vadObject.options.fftSize / 2;
            const floatFrequencyData = new Float32Array(frequencyBinCount);
            getFloatFrequencyData(floatFrequencyData, _fdata, frequencyBinCount);
            
            /*
            console.log(buffer.length);
            console.log(pcmBuffer.length);
            console.log(pcmBuffer.slice(0,20));
            console.log(floatFrequencyData.length);
            console.log(floatFrequencyData.slice(0,20));
            assf
            
            if (i === 1024) {
                afsfsdf;
            }
            */

            const { vadClass, voiceTrend } = vadObject.processFrequencyData(floatFrequencyData);
            if (prevVadClass !== vadClass) {
                console.log(
                    i * 1/vadObject.options.sampleRate,
                    (i+vadObject.options.bufferLen) * 1/vadObject.options.sampleRate,
                    vadClass,
                    voiceTrend,
                );
                // console.log(pcmBuffer);
                // console.log(_fdata);
                // console.log(floatFrequencyData);
            }
            prevVadClass = vadClass;
        }
    });
});

const _capture = (pcmBuffer, _data, _fdata, _fftCount, fftSize, bufferSize, smoothingTimeConstant) => {
    var channelData =  Array.prototype.slice.call(pcmBuffer);
    // console.log(channelData);
    
	//shift data & ensure size
    _data = _data.concat(channelData).slice(-bufferSize);
    
	//increase count
	_fftCount += channelData.length;

	//perform fft, if enough new data
	if (_fftCount >= fftSize) {
		_fftCount = 0;

        var input = _data.slice(-fftSize);

		//do windowing
		for (var i = 0; i < fftSize; i++) {
			input[i] *= applyWindow(i, fftSize);
        }
        
		//create complex parts
		var inputRe = ndarray(input);
		var inputIm = ndarray(new Float32Array(fftSize));

		//do fast fourier transform
        fft(1, inputRe, inputIm);

		//apply smoothing factor
        var k = Math.min(1, Math.max(smoothingTimeConstant, 0));

        //for magnitude imaginary component is blown away. Not necessary though.
		for (var i = 0; i < fftSize; i++) {
            _fdata[i] = k* _fdata[i] + (1 - k) * Math.sqrt(Math.pow(inputRe.get(i),2) + Math.pow(inputIm.get(i),2)) / fftSize;
            // Math.abs(inputRe.get(i)) / fftSize;
        }
    }
    
    return _data, _fdata;
} 

const getFloatFrequencyData = function (arr, _fdata, frequencyBinCount) {
    // https://stackoverflow.com/questions/26241430/fft-values-of-webaudios-analysernode-are-outside-range

	if (!arr) return arr;
    
	for (var i = 0, l = Math.min(frequencyBinCount, arr.length); i < l; i++) {
		arr[i] = db(_fdata[i]);
	}

	return arr;
};

/*
audioFileAsset.decodeToBuffer((buffer) => {
    console.log(buffer);
});
*/
/*
const vadObject = new VAD({
    sampleRate: 22500,
});

const frequencyDomainData = [];

for (var i = 0; i < 512; i++) {
    frequencyDomainData.push(0.5);
}

const vadClass = vadObject.processFrequencyData(frequencyDomainData);
console.log(vadClass);
*/