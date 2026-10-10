// Camera flashlight (torch) control for blinking Morse.
//
// Only Android Chrome (and a few others) expose the torch constraint.
// Everything else: requestTorch() resolves null → hide the flash toggle.

export interface Torch {
  on: () => Promise<void>;
  off: () => Promise<void>;
  dispose: () => void;
}

/**
 * Ask for the rear camera and return a torch handle, or null when
 * unsupported/denied. Must be called from a user gesture.
 */
export async function requestTorch(): Promise<Torch | null> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return null;
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });
  } catch {
    return null; // denied, or no camera
  }

  const track = stream.getVideoTracks()[0];
  const caps = track?.getCapabilities?.() as { torch?: boolean } | undefined;
  if (!track || !caps?.torch) {
    stream.getTracks().forEach((t) => t.stop());
    return null; // this device has no flash to blink
  }

  const set = async (on: boolean) => {
    try {
      await track.applyConstraints({
        advanced: [{ torch: on } as MediaTrackConstraintSet],
      });
    } catch {
      /* best effort — a missed blink is not fatal */
    }
  };

  return {
    on: () => set(true),
    off: () => set(false),
    dispose: () => stream.getTracks().forEach((t) => t.stop()),
  };
}
