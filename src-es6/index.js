import VAD from './lib/vad2';

export default function SimpleVad(options) {
  this.vad = new VAD(options);
  this.options = this.vad.options;

  this.predict = (floatPcmBuffer) => {
    const resultObject = this.vad.detectVoiceActivity(floatPcmBuffer);
    return resultObject;
  };

  return {
    options: this.options,
    predict: this.predict,
  };
}
