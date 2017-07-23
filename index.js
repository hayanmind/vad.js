import VAD from './lib/vad';
import AV from 'av';
import { FFT } from './node_modules/jsfft/dist/fft';

const audioFileAsset = AV.Asset.fromFile("./micro-doc.wav");
audioFileAsset.get('format', (format) => {
    console.log(format);
    const vadObject = new VAD({
        sampleRate: format.sampleRate,
        fftSize: 256,
        bufferLen: 256, 
    });
    audioFileAsset.decodeToBuffer((buffer) => {
        for (let i=256; i<buffer.length; i=i+256) {
            const pcmBuffer = buffer.slice(0, i);
            const fftBuffer = FFT(pcmBuffer);

            // console.log(pcmBuffer);
            // console.log(fftBuffer);

            const vadClass = vadObject.processFrequencyData(fftBuffer.real);
            console.log(vadClass);
        }
    });
});

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