import AV from 'av';
import SimpleVad from 'simple-vad';

const audioFileAsset = AV.Asset.fromFile('./audio/Learning_Korean.wav');

audioFileAsset.get('format', (format) => {
  console.log(format);
  const options = {
    sampleRate: format.sampleRate,
    energy_threshold_ratio_pos: 1.5,
    energy_threshold_ratio_neg: 0.75,
    energy_integration: 0.75,
    filter: [{ f: 100000, v: 1 }], // no filter
  };

  const vadObject = new SimpleVad(options);
  const { bufferSize } = vadObject.options;

  console.log(vadObject);

  let prevVadClass = '';
  let voicedCnt = 0;
  let unvoicedCnt = 0;

  audioFileAsset.decodeToBuffer((audioBuffer) => {
    for (let i = 0; i < audioBuffer.length; i += bufferSize) {
      const pcmBuffer = audioBuffer.slice(i, i + bufferSize);
      const { vadClass } = vadObject.predict(pcmBuffer);

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
        );
      }
      prevVadClass = vadClass;
    }
    console.log(voicedCnt, unvoicedCnt);
  });
});
