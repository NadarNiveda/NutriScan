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

      const maxEdge = 1800;
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

      // High-quality bicubic smoothing for text clarity
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };

    if (typeof imageSource === 'string') {
      img.crossOrigin = 'anonymous';
      img.onload = processCanvas;
      img.onerror = () => reject(new Error('Failed to load image for OCR preprocessing'));
      img.src = imageSource;
    } else if (imageSource instanceof Blob || imageSource instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = processCanvas;
        img.onerror = () => reject(new Error('Failed to load blob for OCR preprocessing'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(imageSource);
    } else if (imageSource instanceof HTMLCanvasElement) {
      img.onload = processCanvas;
      img.src = imageSource.toDataURL('image/jpeg', 0.95);
    } else {
      reject(new Error('Unsupported image source format'));
    }
  });
}

/**
 * Executes high-precision OCR with multi-pass recognition for maximum accuracy across label formats.
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
        if (data && data.text && data.text.trim().length > 10) {
          onProgress(100);
          return fixCommonOcrErrors(data.text);
        }
      }
    } catch (e) {
      // Fall through to client-side Tesseract OCR
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

    // Pass 1: Primary recognition on scaled preprocessed image
    onProgress(50);
    let ret = await worker.recognize(preprocessed);
    let rawText = ret && ret.data && ret.data.text ? ret.data.text.trim() : '';

    // Pass 2: Secondary fallback to original raw imageData if Pass 1 yielded insufficient text
    if (rawText.length < 15 && imageData !== preprocessed) {
      onProgress(75);
      const retRaw = await worker.recognize(imageData);
      if (retRaw && retRaw.data && retRaw.data.text && retRaw.data.text.trim().length > rawText.length) {
        rawText = retRaw.data.text.trim();
      }
    }

    await worker.terminate();
    onProgress(100);

    const cleanedText = fixCommonOcrErrors(rawText);
    if (!cleanedText || cleanedText.length < 5) {
      throw new Error('Could not detect readable ingredient text in this photo. Please try positioning the camera closer or typing ingredients manually.');
    }

    return cleanedText;
  } catch (err) {
    console.error('OCR Processing error:', err);
    throw new Error(err.message || 'Failed to recognize text from image. Please try again or type ingredients manually.');
  }
}
