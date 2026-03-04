// processor.js  — loaded by AudioWorklet, runs in a dedicated audio thread
// Converts Float32 mic samples → Int16 PCM and posts them to the main thread

class MicProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._active = true;
    this.port.onmessage = (e) => {
      if (e.data === "stop") this._active = false;
    };
  }

  process(inputs) {
    if (!this._active) return false; // returning false removes the node

    const input = inputs[0];
    if (!input || !input[0]) return true;

    const float32 = input[0]; // mono channel
    const int16 = new Int16Array(float32.length);

    // Convert float32 [-1, 1] → int16 [-32768, 32767]
    for (let i = 0; i < float32.length; i++) {
      const clamped = Math.max(-1, Math.min(1, float32[i]));
      int16[i] = clamped < 0 ? clamped * 32768 : clamped * 32767;
    }

    // Transfer the buffer (zero-copy) to the main thread
    this.port.postMessage(int16.buffer, [int16.buffer]);
    return true;
  }
}

registerProcessor("mic-processor", MicProcessor);