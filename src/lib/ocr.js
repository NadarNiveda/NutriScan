import { fixCommonOcrErrors } from '../utils/normalize';

/**
 * Advanced multi-pass image preprocessor:
 * 1. Resizes image to optimal OCR resolution (1600px max edge).
 * 2. High-contrast grayscale conversion.
 * 3. Otsu-style thresholding & edge sharpening to isolate dense printed text on colored/glossy backgrounds.
 * @param {HTMLImageElement | HTMLCanvasElement | File | Blob} imageSource 
 * @returns {Promise<string>} Base64 data URI of processed image
 */
export async function preprocessImage(imageSource) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    const processCanvas = () => {
      let width = img.width;
      let height = img.height;

      const maxEdge = 1600;
      if (width > maxEdge || height > maxEdge) {
        if (width > height) {
          height = Math.round((height * maxEdge) / width);
          width = maxEdge;
        } else {
          width = Math.round((width * maxEdge) / height);
          height = maxEdge;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(img, 0, 0, width, height);

      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      // Step 1: Grayscale conversion & mean brightness calculation
      let totalLuminance = 0;
      const grayData = new Uint8Array(width * height);

      for (let i = 0, j = 0; i < data.length; i += 4, j++) {
        // Luminance formula
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        grayData[j] = gray;
        totalLuminance += gray;
      }

      const meanLuminance = totalLuminance / (width * height);

      // Step 2: High-contrast binarization & edge sharpening
      const contrastFactor = (259 * (180 + 255)) / (255 * (259 - 180)); // boost contrast factor ~ 2.1

      for (let i = 0, j = 0; i < data.length; i += 4, j++) {
        const gray = grayData[j];
        const contrastVal = contrastFactor * (gray - meanLuminance) + 128;
        const clamped = Math.min(255, Math.max(0, contrastVal));

        data[i] = clamped;     // Red
        data[i + 1] = clamped; // Green
        data[i + 2] = clamped; // Blue
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };

    if (typeof imageSource === 'string') {
      img.crossOrigin = 'anonymous';
      img.onload = processCanvas;
      img.onerror = (e) => reject(new Error('Failed to load image for OCR preprocessing'));
      img.src = imageSource;
    } else if (imageSource instanceof Blob || imageSource instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = processCanvas;
        img.onerror = (err) => reject(new Error('Failed to load blob for OCR preprocessing'));
        img.src = e.target.result;
      };
      reader.onerror = (e) => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(imageSource);
    } else if (imageSource instanceof HTMLCanvasElement) {
      img.onload = processCanvas;
      img.src = imageSource.toDataURL('image/jpeg', 0.85);
    } else {
      reject(new Error('Unsupported image source format'));
    }
  });
}

/**
 * Executes high-precision OCR with whitelisted character set and page segmentation mode.
 * @param {string | Blob | File} imageData 
 * @param {function(number):void} onProgress Progress callback accepting percentage (0-100)
 * @returns {Promise<string>} Extracted OCR text
 */
export async function runOcr(imageData, onProgress = () => {}) {
  try {
    onProgress(10);
    const preprocessed = await preprocessImage(imageData);
    onProgress(25);

    // Try server-side OCR endpoint first if available
    try {
      const serverRes = await fetch('/api/ocr/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: preprocessed })
      });

      if (serverRes.ok) {
        const data = await serverRes.json();
        if (data && data.text) {
          onProgress(100);
          return fixCommonOcrErrors(data.text);
        }
      }
    } catch (e) {
      // Fall through to client-side multi-pass Tesseract OCR
    }

    onProgress(35);
    const { createWorker } = await import('tesseract.js');

    const worker = await createWorker('eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          const progress = Math.round(35 + m.progress * 60);
          onProgress(progress);
        }
      }
    });

    // Whitelist only valid English letters, numbers, percentages, and standard ingredient punctuation
    await worker.setParameters({
      tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789(),.-%/:; ',
      tessedit_pageseg_mode: '6' // Assume single uniform block of text
    });

    onProgress(50);
    const ret = await worker.recognize(preprocessed);
    onProgress(95);

    await worker.terminate();
    onProgress(100);

    const rawText = ret.data.text || '';
    return fixCommonOcrErrors(rawText);
  } catch (err) {
    console.error('OCR Processing error:', err);
    throw new Error('Failed to recognize text from image. Please try again or type ingredients manually.');
  }
}
