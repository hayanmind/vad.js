import AV from 'av';
import SimpleVad from 'simple-vad';

const audioFileAsset = AV.Asset.fromFile('./audio/test.wav');

audioFileAsset.get('format', (format) => {
  console.log(format);
  const options = {
    minAmplitude: 0.2,
    voiceTrendMax: 3,
    voiceTrendMin: 0,
    voiceTrendStart: 3,
    voiceTrendEnd: 0,
  };

  const vadObject = new SimpleVad(options);

  console.log(vadObject);

  let prevVadClass = '';
  let voicedCnt = 0;
  let unvoicedCnt = 0;

  audioFileAsset.decodeToBuffer((audioBuffer) => {
    const bufferSize = 512;
    const { sampleRate } = format;
    for (let i = 0; i < audioBuffer.length; i += bufferSize) {
      const floatPcmBuffer = audioBuffer.slice(i, i + bufferSize);
      const { vadClass, voiceTrend, amplitude } = vadObject.predict(floatPcmBuffer);

      if (vadClass === 'voiced') {
        voicedCnt += 1;
      } else if (vadClass === 'unvoiced') {
        unvoicedCnt += 1;
      }
      if (prevVadClass !== vadClass) {
        console.log(
          i * (1 / sampleRate),
          (i + bufferSize) * (1 / sampleRate),
          vadClass,
          voiceTrend,
          amplitude,
        );
      }
      prevVadClass = vadClass;
    }
    console.log(voicedCnt, unvoicedCnt);
  });
});
