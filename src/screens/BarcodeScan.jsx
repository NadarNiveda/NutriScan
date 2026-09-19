import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Barcode, Camera, AlertCircle, RefreshCw } from 'lucide-react';
import ScanButton from '../components/ScanButton';
import { startBarcodeScanner, stopBarcodeScanner } from '../lib/barcode';
import { lookupBarcode } from '../lib/openFoodFacts';

export default function BarcodeScan() {
  const navigate = useNavigate();
  const scannerInstanceRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [scannedCode, setScannedCode] = useState(null);

  useEffect(() => {
    let activeScanner = null;

    async function init() {
      try {
        activeScanner = await startBarcodeScanner(
          'barcode-reader',
          handleBarcodeDetected,
          (err) => {} // ignore frame noise errors
        );
        scannerInstanceRef.current = activeScanner;
      } catch (err) {
        console.warn('Barcode camera error:', err);
        setErrorMessage('Unable to access camera for barcode scanning. Please check camera permissions.');
      }
    }

    init();

    return () => {
      if (scannerInstanceRef.current) {
        stopBarcodeScanner(scannerInstanceRef.current);
      }
    };
  }, []);

  const handleBarcodeDetected = async (code) => {
    if (isLoading || scannedCode === code) return;

    setScannedCode(code);
    setIsLoading(true);

    if (scannerInstanceRef.current) {
      await stopBarcodeScanner(scannerInstanceRef.current);
    }

    // Lookup barcode on Open Food Facts
    const res = await lookupBarcode(code);

    setIsLoading(false);

    if (res.success) {
      // Proceed directly to review text
      navigate('/review-text', {
        state: {
          rawText: res.rawText,
          productTitle: res.title,
          brand: res.brand,
          image: res.image,
          categoriesTags: res.categoriesTags,
          barcode: code
        }
      });
    } else {
      setErrorMessage(res.errorReason || 'Product not found in barcode database.');
    }
  };

  const handleRetry = () => {
    setErrorMessage(null);
    setScannedCode(null);
    setIsLoading(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between max-w-md mx-auto relative overflow-hidden">
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-slate-950/90 to-transparent">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="p-2.5 rounded-full bg-slate-900/80 text-white border border-slate-700 min-h-[48px] min-w-[48px] flex items-center justify-center"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="font-bold text-sm tracking-wide text-slate-200">Barcode Scanner</span>
        <div className="w-10"></div>
      </div>

      {/* Main Scanner Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
        {errorMessage ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 max-w-xs z-30">
            <div className="w-14 h-14 rounded-full bg-amber-950 border border-amber-500/50 flex items-center justify-center text-amber-400 mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-lg text-slate-100">Lookup Result</h3>
            <p className="text-slate-300 text-sm leading-relaxed">{errorMessage}</p>
            <div className="space-y-2.5 pt-2">
              <ScanButton onClick={handleRetry} variant="primary" icon={RefreshCw}>
                Try Scanning Again
              </ScanButton>
              <ScanButton onClick={() => navigate('/camera-scan')} variant="secondary" icon={Camera}>
                Photograph Package Label
              </ScanButton>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center space-y-4">
            <div className="w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden border-2 border-green-500 shadow-2xl relative bg-slate-900 flex items-center justify-center">
              <div id="barcode-reader" className="w-full h-full"></div>
              {isLoading && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-40 space-y-3">
                  <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-bold text-slate-200">Fetching Open Food Facts data...</p>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-400 text-center max-w-xs">
              Align the barcode inside the frame. We will automatically look up its official ingredients list.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Option */}
      <div className="p-6 bg-slate-900 border-t border-slate-800">
        <ScanButton onClick={() => navigate('/camera-scan')} variant="secondary" icon={Camera}>
          Switch to Label Camera
        </ScanButton>
      </div>
    </div>
  );
}
