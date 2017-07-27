// https://webaudio.github.io/web-audio-api/#widl-AnalyserNode-maxDecibels

import AV from 'av';
import VAD from './lib/vad';
import FFT from './lib/fft';

const audioFileAsset = AV.Asset.fromFile('./audio/micro-doc.wav');

audioFileAsset.get('format', (format) => {
  console.log(format);
  const vadObject = new VAD({
    sampleRate: format.sampleRate,
    energy_threshold_ratio_pos: 1.5,
    energy_threshold_ratio_neg: 0.75,
    energy_integration: 0.75,
    filter: [{ f: 100000, v: 1 }], // no filter
  });

  const { fftSize, bufferLen, smoothingTimeConstant } = vadObject.options;
  const fft = new FFT(fftSize, bufferLen, smoothingTimeConstant);

  console.log(vadObject);

  let prevVadClass = '';
  audioFileAsset.decodeToBuffer((buffer) => {
    for (let i = 0; i < buffer.length; i += bufferLen) {
      const pcmBuffer = buffer.slice(i, i + bufferLen);
      fft.capture(pcmBuffer);
      const floatFrequencyData = fft.getFloatFrequencyData();

      const { vadClass, voiceTrend } = vadObject.processFrequencyData(floatFrequencyData);
      if (prevVadClass !== vadClass) {
        console.log(
          i * (1 / vadObject.options.sampleRate),
          (i + vadObject.options.bufferLen) * (1 / vadObject.options.sampleRate),
          vadClass,
          voiceTrend,
        );
      }
      prevVadClass = vadClass;
    }
  });
});
