// https://webaudio.github.io/web-audio-api/#widl-AnalyserNode-maxDecibels

import AV from 'av';
import VAD from './lib/vad';
import FFT from './lib/fft';

const audioFileAsset = AV.Asset.fromFile('./audio/Learning_Korean.wav');

audioFileAsset.get('format', (format) => {
  console.log(format);
  const vadObject = new VAD({
    sampleRate: format.sampleRate,
    energy_threshold_ratio_pos: 1.5,
    energy_threshold_ratio_neg: 0.75,
    energy_integration: 0.75,
    filter: [{ f: 100000, v: 1 }], // no filter
  });

  const { fftSize, bufferSize, smoothingTimeConstant } = vadObject.options;
  const fft = new FFT(fftSize, bufferSize, smoothingTimeConstant);

  console.log(vadObject);

  let prevVadClass = '';
  let voicedCnt = 0;
  let unvoicedCnt = 0;
  audioFileAsset.decodeToBuffer((audioBuffer) => {
    for (let i = 0; i < audioBuffer.length; i += bufferSize) {
      const pcmBuffer = audioBuffer.slice(i, i + bufferSize);
      fft.capture(pcmBuffer);
      const floatFrequencyData = fft.getFloatFrequencyData();

      const { vadClass, voiceTrend } = vadObject.processFrequencyData(floatFrequencyData);
      if (vadClass === 'voiced') {
        voicedCnt += 1;
      } else if (vadClass === 'unvoiced') {
        unvoicedCnt += 1;
      }
      if (prevVadClass !== vadClass) {
        console.log(
          i * (1 / vadObject.options.sampleRate),
          (i + vadObject.options.bufferSize) * (1 / vadObject.options.sampleRate),
          vadClass,
          voiceTrend,
        );
      }
      prevVadClass = vadClass;
    }
    console.log(voicedCnt, unvoicedCnt);
  });
});
