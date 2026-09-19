import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image as ImageIcon, Type, ArrowLeft, AlertCircle, UploadCloud, RefreshCw, Smartphone } from 'lucide-react';
import ScanButton from '../components/ScanButton';
import ProgressBar from '../components/ProgressBar';
import { runOcr } from '../lib/ocr';

export default function CameraScan() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const nativeCameraInputRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' or 'user'
  const [cameraError, setCameraError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);

  useEffect(() => {
    let activeStream = null;

    async function initCamera() {
      setCameraError(null);
      try {
        let mediaStream;
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: facingMode } },
            audio: false
          });
        } catch (exactErr) {
          // Fallback to ideal facingMode or general video stream
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: facingMode } },
            audio: false
          });
        }

        activeStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.warn('Camera stream access unavailable:', err);
        setCameraError('Live browser camera unavailable or permission denied. Tap below to use your phone camera or upload a photo.');
      }
    }

    initCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const toggleCameraFacing = () => {
    stopCamera();
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUri = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUri);
    stopCamera();
    processImage(dataUri);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target.result;
      setCapturedImage(dataUri);
      stopCamera();
      processImage(dataUri);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (imageUri) => {
    setIsProcessing(true);
    setOcrProgress(5);

    try {
      const extractedText = await runOcr(imageUri, (progress) => {
        setOcrProgress(progress);
      });

      navigate('/review-text', {
        state: {
          rawText: extractedText,
          imageUri
        }
      });
    } catch (err) {
      alert(err.message || 'Error processing image');
      setIsProcessing(false);
      setCapturedImage(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between max-w-5xl mx-auto relative overflow-hidden md:rounded-3xl md:my-6 md:border md:border-slate-800 shadow-2xl">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 z-20">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-sm sm:text-base tracking-wide text-slate-200 truncate mx-2">
          Ingredient Label Camera Scanner
        </span>

        <div className="flex items-center gap-2">
          {stream && (
            <button
              type="button"
              onClick={toggleCameraFacing}
              className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Flip Camera"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Choose Image"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hidden Inputs for File & Native Camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Main Responsive Split Area */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 p-4 md:p-6 items-center">
        {/* Left Side: Camera or Captured Preview */}
        <div className="md:col-span-7 flex flex-col items-center justify-center relative min-h-[360px] md:min-h-[480px] w-full">
          {capturedImage ? (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
              <div className="w-full max-h-[380px] rounded-2xl overflow-hidden border-2 border-green-500 shadow-2xl">
                <img src={capturedImage} alt="Captured label" className="w-full h-full object-cover" />
              </div>
              <ProgressBar progress={ocrProgress} statusText={isProcessing ? "Extracting label text..." : "Done"} />
            </div>
          ) : cameraError ? (
            <div className="p-6 text-center space-y-4 max-w-sm bg-slate-900 rounded-2xl border border-slate-800 shadow-xl">
              <div className="w-14 h-14 rounded-full bg-amber-950 border border-amber-500/50 flex items-center justify-center text-amber-400 mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{cameraError}</p>

              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-950/50 min-h-[48px]"
              >
                <Smartphone className="w-5 h-5" /> Open Mobile Camera App
              </button>
            </div>
          ) : (
            <div className="w-full h-full relative flex items-center justify-center bg-black rounded-2xl overflow-hidden border border-slate-800">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover min-h-[360px] md:min-h-[480px]"
              />

              {/* Framing Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-[340px] aspect-[4/3] border-2 border-green-500/90 rounded-2xl shadow-[0_0_0_9999px_rgba(15,23,42,0.7)] relative flex items-center justify-center">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-xl -mt-1 -ml-1"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-xl -mt-1 -mr-1"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-xl -mb-1 -ml-1"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-xl -mb-1 -mr-1"></div>

                  <p className="bg-slate-900/90 text-slate-200 text-xs font-semibold px-4 py-2 rounded-full border border-slate-700 backdrop-blur-sm shadow-md">
                    Fit the ingredient list inside the frame
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Direct Camera Triggers & Manual Options (Desktop & Mobile) */}
        <div className="md:col-span-5 space-y-4">
          <div
            onClick={() => nativeCameraInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-green-500 rounded-2xl p-5 text-center cursor-pointer transition-all bg-slate-900/80 space-y-2 group"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-800 text-green-400 group-hover:bg-green-600 group-hover:text-white flex items-center justify-center mx-auto transition-colors">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-100">Take Photo with Phone Camera</h3>
              <p className="text-xs text-slate-400 mt-0.5">Launches native phone camera app instantly</p>
            </div>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-green-500 rounded-2xl p-5 text-center cursor-pointer transition-all bg-slate-900/80 space-y-2 group"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-800 text-green-400 group-hover:bg-green-600 group-hover:text-white flex items-center justify-center mx-auto transition-colors">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-100">Upload Image File</h3>
              <p className="text-xs text-slate-400 mt-0.5">PNG, JPG, or WebP package label photos</p>
            </div>
          </div>

          <ScanButton
            onClick={() => navigate('/review-text', { state: { rawText: '' } })}
            variant="secondary"
            icon={Type}
          >
            Type Ingredients Manually
          </ScanButton>
        </div>
      </div>

      {/* Shutter Bar */}
      {!capturedImage && !cameraError && (
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-6 z-20">
          <button
            type="button"
            onClick={handleCapture}
            className="w-20 h-20 rounded-full border-4 border-white bg-green-600 flex items-center justify-center active:scale-95 shadow-xl shadow-green-950/60"
            aria-label="Capture photo"
          >
            <div className="w-16 h-16 rounded-full border-2 border-green-200 bg-green-500 flex items-center justify-center">
              <Camera className="w-8 h-8 text-white stroke-[2.5]" />
            </div>
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

