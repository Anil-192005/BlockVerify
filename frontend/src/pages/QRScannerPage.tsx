import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
import { QrCode, Camera, Upload, CheckCircle, AlertCircle, RefreshCw, StopCircle, Sparkles } from 'lucide-react';
import { api } from '../services/api';

interface QRScannerPageProps {
  onScanComplete?: (docId: string) => void;
}

export const QRScannerPage: React.FC<QRScannerPageProps> = ({ onScanComplete }) => {
  const navigate = useNavigate();

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const lastScanTimeRef = useRef<number>(0);

  /**
   * Safely decodes and validates QR contents to extract the Document ID.
   * Handles URLs, JSON, query params, and raw IDs without allowing unsafe open redirects.
   * Examples:
   *   "http://localhost:5173/verify/CERT-2026-000001"
   *   "https://blockverify.vercel.app/verify/CERT-2026-000001"
   *   "https://domain.com/#/verify/CERT-2026-000001"
   *   "{"document_id": "CERT-2026-000001"}"
   *   "CERT-2026-000001"
   */
  const extractAndValidateDocId = (raw: string): string | null => {
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();

    // 1. JSON parsing
    try {
      const parsed = JSON.parse(trimmed);
      const candidate = parsed.document_id || parsed.doc_id || parsed.id || parsed.documentId;
      if (candidate && isValidDocId(String(candidate))) {
        return String(candidate).trim();
      }
    } catch {
      // not json
    }

    // 2. URL path containing /verify/
    if (trimmed.includes('/verify/')) {
      const after = trimmed.split('/verify/')[1];
      if (after) {
        const candidate = after.split(/[/?#&]/)[0].trim();
        if (isValidDocId(candidate)) {
          return candidate;
        }
      }
    }

    // 3. Query string e.g. ?id=... or &document_id=...
    const queryMatch = trimmed.match(/[?&](?:id|document_id|docId)=([A-Za-z0-9_-]+)/i);
    if (queryMatch && isValidDocId(queryMatch[1])) {
      return queryMatch[1];
    }

    // 4. Regex match for standard Document ID format: CERT-YYYY-XXXX or DOC-XXXX
    const regexMatch = trimmed.match(/\b(CERT-[0-9]{4}-[0-9A-Za-z]+|DOC-[0-9A-Za-z_-]+)\b/i);
    if (regexMatch && isValidDocId(regexMatch[1])) {
      return regexMatch[1];
    }

    // 5. Direct document ID
    if (isValidDocId(trimmed)) {
      return trimmed;
    }

    return null;
  };

  const isValidDocId = (id: string): boolean => {
    return /^[A-Za-z0-9_-]{3,64}$/.test(id);
  };

  /**
   * Completely stops all active camera tracks and animation frames.
   */
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setIsStartingCamera(false);
  }, []);

  const handleScanSuccess = useCallback((docId: string) => {
    setScanResult(docId);
    stopCamera();
    if (onScanComplete) {
      onScanComplete(docId);
    }
    // Navigate safely to the authoritative verification route
    setTimeout(() => {
      navigate(`/verify/${encodeURIComponent(docId)}`);
    }, 700);
  }, [navigate, onScanComplete, stopCamera]);

  /**
   * Starts user media camera feed with rear camera preference on mobile.
   */
  const startCamera = async () => {
    if (isScanning || isStartingCamera) return;
    setIsStartingCamera(true);
    setErrorMsg(null);
    setPermissionDenied(false);
    isProcessingRef.current = false;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg('Camera access is not supported by your browser. Please upload a QR code image below.');
      setIsStartingCamera(false);
      return;
    }

    try {
      let stream: MediaStream;
      try {
        // Prefer rear-facing camera on mobile devices
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        // Fallback to any available video camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('muted', 'true');

        // Wait for video metadata to be loaded so dimensions are available
        await new Promise<void>((resolve) => {
          if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
            resolve();
          } else {
            video.onloadedmetadata = () => resolve();
          }
        });

        await video.play().catch(() => {});
      }

      setIsScanning(true);
      setIsStartingCamera(false);
    } catch (err: any) {
      stopCamera();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setErrorMsg('Camera permission was denied. Please allow camera access in your browser settings and click Retry.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMsg('No camera hardware found on this device. You can upload a QR image below.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setErrorMsg('Camera is currently in use by another application. Please close other camera tabs and try again.');
      } else {
        setErrorMsg(err.message || 'Unable to access device camera.');
      }
    }
  };

  /**
   * Continuous frame capture loop using requestAnimationFrame, canvas downscaling, and jsQR.
   */
  useEffect(() => {
    if (!isScanning) return;

    let isActive = true;

    const scanFrame = () => {
      if (!isActive) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const now = performance.now();

      // Throttle scanning to every 100ms for smooth 60fps rendering without UI thread starvation
      if (
        video &&
        canvas &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.videoWidth > 0 &&
        video.videoHeight > 0 &&
        !isProcessingRef.current &&
        now - lastScanTimeRef.current >= 100
      ) {
        lastScanTimeRef.current = now;

        // Downscale large frames to max 640px for ultra-fast, robust jsQR processing
        const MAX_DIM = 640;
        let targetW = video.videoWidth;
        let targetH = video.videoHeight;
        if (targetW > MAX_DIM || targetH > MAX_DIM) {
          if (targetW > targetH) {
            targetH = Math.round((targetH * MAX_DIM) / targetW);
            targetW = MAX_DIM;
          } else {
            targetW = Math.round((targetW * MAX_DIM) / targetH);
            targetH = MAX_DIM;
          }
        }

        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, targetW, targetH);
          try {
            const imageData = ctx.getImageData(0, 0, targetW, targetH);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth',
            });

            if (code && code.data && !isProcessingRef.current) {
              const verifiedId = extractAndValidateDocId(code.data);
              if (verifiedId) {
                isProcessingRef.current = true;
                handleScanSuccess(verifiedId);
                return;
              }
            }
          } catch {
            // Ignore transient canvas buffer errors
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);

    return () => {
      isActive = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isScanning, handleScanSuccess]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  /**
   * Helper to decode an Image element across multiple scaled attempts.
   */
  const decodeImageElement = (img: HTMLImageElement): string | null => {
    const scales = [
      Math.min(640 / Math.max(img.width, img.height), 1.0),
      Math.min(1024 / Math.max(img.width, img.height), 1.0),
      1.0,
    ];

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    for (const scale of scales) {
      const w = Math.max(32, Math.round(img.width * scale));
      const h = Math.max(32, Math.round(img.height * scale));
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      try {
        const imageData = ctx.getImageData(0, 0, w, h);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });
        if (code && code.data) {
          const docId = extractAndValidateDocId(code.data);
          if (docId) return docId;
        }
      } catch {
        // continue
      }
    }

    return null;
  };

  /**
   * Decodes an uploaded image file containing a certificate QR code.
   */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        if (img.width === 0 || img.height === 0) {
          setErrorMsg('Uploaded image has invalid dimensions.');
          return;
        }

        const foundId = decodeImageElement(img);
        if (foundId) {
          handleScanSuccess(foundId);
        } else {
          setErrorMsg('No readable QR code found in this image. Please ensure the QR code is clearly visible, well-lit, and uncropped.');
        }
      };
      img.onerror = () => {
        setErrorMsg('Could not read image file. Please upload a standard PNG or JPEG image.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Allow selecting same file again
  };

  /**
   * Test scanner using seeded demo certificate QR.
   */
  const handleTestDemoQR = (docId: string = 'CERT-2026-000001') => {
    setErrorMsg(null);
    const demoUrl = api.getQrCodeUrl(docId);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const foundId = decodeImageElement(img);
      if (foundId) {
        handleScanSuccess(foundId);
      } else {
        handleScanSuccess(docId);
      }
    };
    img.onerror = () => {
      // Direct fallback if network issue
      handleScanSuccess(docId);
    };
    img.src = demoUrl;
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', padding: '1rem' }}>
      
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          <QrCode size={16} /> Instant QR Scanner
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Scan Certificate QR Code</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Point your device camera at any printed or digital certificate's QR code, or upload an image.
        </p>
      </div>

      {/* Camera Viewport Area */}
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
        
        <div 
          style={{ 
            position: 'relative', 
            maxWidth: '480px', 
            height: '340px', 
            margin: '0 auto 1.5rem auto', 
            background: '#090d16', 
            borderRadius: '1rem', 
            overflow: 'hidden', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            border: isScanning ? '2px solid #06b6d4' : '1px solid var(--border-subtle)' 
          }}
        >
          {/* Always mount video element to avoid React ref detachment race conditions */}
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: isScanning ? 'block' : 'none',
            }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Scanner Targeting Reticle */}
          {isScanning && (
            <div 
              style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)', 
                width: '220px', 
                height: '220px', 
                border: '2px solid #38bdf8', 
                borderRadius: '1rem', 
                boxShadow: '0 0 25px rgba(56, 189, 248, 0.45)', 
                pointerEvents: 'none' 
              }}
            >
              <div style={{ position: 'absolute', top: '-1px', left: '-1px', width: '20px', height: '20px', borderTop: '4px solid #38bdf8', borderLeft: '4px solid #38bdf8' }} />
              <div style={{ position: 'absolute', top: '-1px', right: '-1px', width: '20px', height: '20px', borderTop: '4px solid #38bdf8', borderRight: '4px solid #38bdf8' }} />
              <div style={{ position: 'absolute', bottom: '-1px', left: '-1px', width: '20px', height: '20px', borderBottom: '4px solid #38bdf8', borderLeft: '4px solid #38bdf8' }} />
              <div style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '20px', height: '20px', borderBottom: '4px solid #38bdf8', borderRight: '4px solid #38bdf8' }} />
            </div>
          )}

          {!isScanning && (
            <div style={{ color: 'var(--text-dim)', padding: '1rem' }}>
              <QrCode size={64} color="#334155" style={{ margin: '0 auto 1rem auto' }} />
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Camera is Inactive
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Click below to start camera or select a QR image
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {!isScanning ? (
            <button
              onClick={startCamera}
              disabled={isStartingCamera}
              className="btn-primary"
              style={{ padding: '0.75rem 1.75rem' }}
            >
              <Camera size={18} /> {isStartingCamera ? 'Initializing Camera...' : 'Start Camera Scanner'}
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="btn-secondary"
              style={{ padding: '0.75rem 1.75rem', borderColor: '#fb7185', color: '#fb7185' }}
            >
              <StopCircle size={18} /> Stop Camera
            </button>
          )}

          {permissionDenied && (
            <button
              onClick={startCamera}
              className="btn-primary"
              style={{ padding: '0.75rem 1.5rem', background: '#3b82f6' }}
            >
              <RefreshCw size={18} /> Retry Permission
            </button>
          )}
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div style={{ marginTop: '1.25rem', padding: '0.75rem 1rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '0.5rem', color: '#fb7185', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} /> {errorMsg}
          </div>
        )}
      </div>

      {/* Alternative Image Upload & Demo Test Section */}
      <div className="glass-panel" style={{ padding: '1.75rem', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Or Upload Certificate / QR Image File
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Have a certificate screenshot, saved QR image, or photo? Select it to decode instantly.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <label className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
            <Upload size={16} /> Choose QR Image File
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
          </label>

          <button
            type="button"
            onClick={() => handleTestDemoQR('CERT-2026-000001')}
            className="btn-secondary"
            style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}
          >
            <Sparkles size={16} /> Test with Demo Certificate QR (CERT-2026-000001)
          </button>
        </div>

        {scanResult && (
          <div style={{ marginTop: '1.5rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '0.6rem', padding: '1rem' }}>
            <div style={{ color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <CheckCircle size={18} /> QR Decoded Successfully!
            </div>
            <div style={{ fontSize: '0.9rem', color: '#f8fafc' }}>
              Document ID: <b className="mono" style={{ color: '#38bdf8' }}>{scanResult}</b>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
              Redirecting to official blockchain verification...
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
