import { Html5Qrcode } from 'html5-qrcode';

/**
 * Initializes HTML5 QrCode barcode reader on a target DOM element ID.
 * @param {string} elementId 
 * @param {function(string): void} onScanSuccess 
 * @param {function(string): void} onScanError 
 * @returns {Promise<Html5Qrcode>}
 */
export async function startBarcodeScanner(elementId, onScanSuccess, onScanError = () => {}) {
  const html5QrCode = new Html5Qrcode(elementId);

  const config = {
    fps: 10,
    qrbox: { width: 280, height: 160 },
    aspectRatio: 1.0
  };

  try {
    await html5QrCode.start(
      { facingMode: 'environment' },
      config,
      (decodedText, decodedResult) => {
        onScanSuccess(decodedText);
      },
      (errorMessage) => {
        onScanError(errorMessage);
      }
    );
    return html5QrCode;
  } catch (err) {
    console.error('Barcode scanner start error:', err);
    throw err;
  }
}

/**
 * Stops and cleans up html5-qrcode scanner instance.
 * @param {Html5Qrcode} instance 
 */
export async function stopBarcodeScanner(instance) {
  if (instance && instance.isScanning) {
    try {
      await instance.stop();
      await instance.clear();
    } catch (e) {
      console.warn('Error stopping barcode scanner:', e);
    }
  }
}
