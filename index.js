import VAD from './lib/vad';

const vadObject = new VAD({
    sampleRate: 22500,
});

const frequencyDomainData = [];

for (var i = 0; i < 512; i++) {
    frequencyDomainData.push(0.5);
}

const vadClass = vadObject.processFrequencyData(frequencyDomainData);
console.log(vadClass);
