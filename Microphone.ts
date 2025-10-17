// Microphone is a static class that handles microphone input and provides the current volume level.
  
export default class Microphone {
  static audioContext: AudioContext;
  static analyser: AnalyserNode;
  static dataArray: Uint8Array;
  static volume: number = 0;

  static async init() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      source.connect(this.analyser);
      this.analyser.fftSize = 2 ** 10;
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      this.updateVolume();
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  }

  // peak volume
  static updateVolume() {
    requestAnimationFrame(() => this.updateVolume());
    this.analyser.getByteFrequencyData(this.dataArray as Uint8Array<ArrayBuffer>);
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i]!;
    }
    const average = sum / this.dataArray.length;
    this.volume = average / 255; // Normalize volume to [0, 1]
  }
}
