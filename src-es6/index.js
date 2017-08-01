import VAD from './lib/vad';
import FFT from './lib/fft';

export default function SimpleVad(options) {
  this.vad = new VAD(options);
  this.options = this.vad.options;
  const { fftSize, bufferSize, smoothingTimeConstant } = this.vad.options;
  this.fft = new FFT(fftSize, bufferSize, smoothingTimeConstant);

  this.predict = (floatPcmBuffer) => {
    this.fft.capture(floatPcmBuffer);
    const floatFrequencyData = this.fft.getFloatFrequencyData();
    const { vadClass } = this.vad.processFrequencyData(floatFrequencyData);
    return { vadClass };
  };

  return {
    options: this.options,
    predict: this.predict,
  };
}
