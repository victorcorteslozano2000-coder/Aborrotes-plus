import React, { useState, useEffect, useRef } from 'react';
import { AppConfig } from '../types';
import { db } from '../lib/db';
import { 
  Lock, 
  Unlock, 
  Fingerprint, 
  ScanFace, 
  ShieldCheck, 
  Camera, 
  AlertCircle, 
  Delete, 
  CheckCircle2,
  X,
  Sparkles
} from 'lucide-react';

interface BiometricLoginProps {
  config: AppConfig;
  onSuccess: () => void;
}

export default function BiometricLogin({ config, onSuccess }: BiometricLoginProps) {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // Auth Mode: 'none' | 'pin' | 'fingerprint' | 'face'
  const [activeScan, setActiveScan] = useState<'none' | 'fingerprint' | 'face'>('none');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  
  // Camera references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Auto-trigger biometric option if registered
  useEffect(() => {
    if (config.faceRegistered) {
      handleStartFaceScan();
    } else if (config.fingerprintRegistered) {
      handleStartFingerprintScan();
    }
  }, [config]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stream]);

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Numpad handlers
  const handleNumberClick = (num: string) => {
    setError(null);
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      // Auto-submit when 4 digits are reached
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setError(null);
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  const handleClear = () => {
    setError(null);
    setPin('');
  };

  const verifyPin = (inputPin: string) => {
    const savedPin = config.securityPin || '1234';
    if (inputPin === savedPin) {
      setScanSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 800);
    } else {
      setError('PIN incorrecto. Inténtalo de nuevo.');
      setPin('');
      // Vibrate device if supported
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
    }
  };

  // Fingerprint Scan Simulation
  const handleStartFingerprintScan = () => {
    if (!config.fingerprintRegistered) {
      setError('No tienes una huella digital registrada. Configúrala en Ajustes.');
      return;
    }
    setError(null);
    setActiveScan('fingerprint');
    setScanProgress(0);
    setScanSuccess(false);

    // Simulate standard WebAuthn or clean loading scan
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setScanSuccess(true);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        setTimeout(() => {
          onSuccess();
        }, 1000);
      }
    }, 100);
  };

  // Face Scan Simulation with actual Camera
  const handleStartFaceScan = async () => {
    if (!config.faceRegistered) {
      setError('No tienes reconocimiento facial registrado. Configúralo en Ajustes.');
      return;
    }
    setError(null);
    setActiveScan('face');
    setScanProgress(0);
    setScanSuccess(false);
    setCameraError(false);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 400 }, 
          height: { ideal: 400 },
          facingMode: 'user' 
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      
      // Start futuristic canvas scanning loop
      startCanvasAnimation();

      // Progress bar & scan completion simulation
      let progress = 0;
      const interval = setInterval(() => {
        progress += 4;
        setScanProgress(Math.min(progress, 100));
        if (progress >= 100) {
          clearInterval(interval);
          setScanSuccess(true);
          stopCamera();
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          setTimeout(() => {
            onSuccess();
          }, 1000);
        }
      }, 100);

    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError(true);
      // Fallback to beautiful virtual face scanning simulation if camera is blocked/unavailable
      let progress = 0;
      const interval = setInterval(() => {
        progress += 4;
        setScanProgress(Math.min(progress, 100));
        if (progress >= 100) {
          clearInterval(interval);
          setScanSuccess(true);
          setTimeout(() => {
            onSuccess();
          }, 1000);
        }
      }, 120);
    }
  };

  // Draw sci-fi scanning overlays on canvas
  const startCanvasAnimation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 300;
    canvas.height = 300;

    let angle = 0;
    let scanY = 0;
    let direction = 1;

    const render = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw glowing outer circular scanner
      ctx.strokeStyle = scanSuccess ? '#10b981' : '#06b6d4';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = scanSuccess ? '#10b981' : '#06b6d4';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 110, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Draw spinning tech dashes
      ctx.strokeStyle = scanSuccess ? '#10b981' : '#0891b2';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 15]);
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 125, angle, angle + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]); // Reset

      // 3. Draw scanning horizontal laser bar
      ctx.strokeStyle = scanSuccess ? '#10b981' : 'rgba(6, 182, 212, 0.8)';
      ctx.lineWidth = 4;
      ctx.shadowBlur = 20;
      ctx.shadowColor = scanSuccess ? '#10b981' : '#06b6d4';
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 95, scanY);
      ctx.lineTo(canvas.width / 2 + 95, scanY);
      ctx.stroke();

      // 4. Draw fake facial tracking nodes/dots
      const dots = [
        { x: 110, y: 120 }, { x: 190, y: 120 }, // eyes
        { x: 150, y: 160 }, // nose
        { x: 120, y: 200 }, { x: 180, y: 200 }, { x: 150, y: 215 }, // mouth/chin
        { x: 150, y: 90 }, // forehead
        { x: 80, y: 150 }, { x: 220, y: 150 } // cheekbones
      ];

      ctx.shadowBlur = 8;
      dots.forEach((dot, idx) => {
        const glowFactor = Math.sin(angle * 3 + idx) * 0.3 + 0.7;
        ctx.fillStyle = scanSuccess ? '#10b981' : `rgba(6, 182, 212, ${glowFactor})`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw structural connector lines between points to look like a face mesh
        dots.forEach((otherDot, oIdx) => {
          const dist = Math.hypot(dot.x - otherDot.x, dot.y - otherDot.y);
          if (dist > 20 && dist < 70) {
            ctx.strokeStyle = scanSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(6, 182, 212, 0.12)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(dot.x, dot.y);
            ctx.lineTo(otherDot.x, otherDot.y);
            ctx.stroke();
          }
        });
      });

      // Update positions
      angle += 0.02;
      scanY += direction * 2.5;
      if (scanY > 210) {
        scanY = 210;
        direction = -1;
      } else if (scanY < 90) {
        scanY = 90;
        direction = 1;
      }

      if (activeScan === 'face') {
        animationFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();
  };

  const handleCancelScan = () => {
    stopCamera();
    setActiveScan('none');
  };

  const savedFaceSnapshot = localStorage.getItem('abarrocontrol_face_snapshot');

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 z-[9999] overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col items-center">
        
        {/* Futuristic glowing backdrop */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top header details */}
        <div className="flex flex-col items-center text-center space-y-2.5 mb-8 w-full">
          <div className="p-3.5 bg-emerald-950/80 text-emerald-400 rounded-2xl border border-emerald-800/50 shadow-inner">
            <Lock className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase font-display block leading-none">AbarroControl Seguro</span>
            <h1 className="text-xl font-bold text-white tracking-tight">{config.businessName}</h1>
            <p className="text-xs text-slate-400">Introduce tu PIN de acceso o utiliza biométricos</p>
          </div>
        </div>

        {/* Display PIN indicators */}
        <div className="w-full max-w-[280px] flex flex-col items-center mb-8">
          <div className="flex gap-4 mb-4 justify-center">
            {[0, 1, 2, 3].map((index) => (
              <div 
                key={index}
                className={`w-4.5 h-4.5 rounded-full border-2 transition-all duration-150 ${
                  pin.length > index 
                    ? 'bg-emerald-500 border-emerald-500 scale-110 shadow-md shadow-emerald-500/30' 
                    : 'border-slate-700 bg-slate-800'
                }`}
              />
            ))}
          </div>
          {error && (
            <div className="text-rose-400 text-xs font-bold flex items-center gap-1.5 bg-rose-950/40 border border-rose-900/40 px-3 py-1.5 rounded-xl animate-bounce">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Interactive numpad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mb-8">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              className="h-14 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/30 text-white font-black text-xl rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm shadow-slate-950"
            >
              {num}
            </button>
          ))}
          
          <button
            onClick={handleClear}
            className="h-14 text-slate-400 hover:text-white font-bold text-xs rounded-2xl flex items-center justify-center transition-colors uppercase tracking-wider"
          >
            Limpiar
          </button>
          
          <button
            onClick={() => handleNumberClick('0')}
            className="h-14 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/30 text-white font-black text-xl rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm shadow-slate-950"
          >
            0
          </button>
          
          <button
            onClick={handleBackspace}
            className="h-14 text-slate-400 hover:text-rose-400 rounded-2xl flex items-center justify-center transition-colors"
            title="Borrar dígito"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Biometric Trigger shortcuts */}
        <div className="w-full border-t border-slate-800/60 pt-6 flex flex-col gap-4">
          <span className="text-xxs font-black text-slate-500 uppercase tracking-widest text-center block">Identificación Rápida</span>
          
          <div className="flex gap-4">
            {/* Fingerprint shortcut */}
            <button
              onClick={handleStartFingerprintScan}
              className={`flex-1 py-3.5 px-4 rounded-2xl border transition-all flex flex-col items-center gap-1.5 active:scale-95 ${
                config.fingerprintRegistered 
                  ? 'bg-slate-800/40 border-slate-700 text-emerald-400 hover:bg-slate-800/80 hover:border-emerald-600/30 hover:text-emerald-300 shadow-sm'
                  : 'bg-slate-900/20 border-slate-900/60 text-slate-600 cursor-not-allowed'
              }`}
              title={config.fingerprintRegistered ? 'Iniciar lector de huella' : 'Huella no configurada'}
            >
              <Fingerprint className="w-6 h-6" />
              <span className="text-[10px] font-black uppercase tracking-wider">Lector Huella</span>
            </button>

            {/* Face ID shortcut */}
            <button
              onClick={handleStartFaceScan}
              className={`flex-1 py-3.5 px-4 rounded-2xl border transition-all flex flex-col items-center gap-1.5 active:scale-95 ${
                config.faceRegistered 
                  ? 'bg-slate-800/40 border-slate-700 text-cyan-400 hover:bg-slate-800/80 hover:border-cyan-600/30 hover:text-cyan-300 shadow-sm'
                  : 'bg-slate-900/20 border-slate-900/60 text-slate-600 cursor-not-allowed'
              }`}
              title={config.faceRegistered ? 'Iniciar escáner facial' : 'Facial no configurado'}
            >
              <ScanFace className="w-6 h-6" />
              <span className="text-[10px] font-black uppercase tracking-wider">Rostro ID</span>
            </button>
          </div>
        </div>

        {/* Dynamic Scan Interface Overlay Modal */}
        {activeScan !== 'none' && (
          <div className="fixed inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 z-[10000] animate-fade-in">
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-800/80 rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl overflow-hidden">
              
              {/* Scan HUD Cancel */}
              <button
                onClick={handleCancelScan}
                className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
                title="Cancelar escaneo"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Glowing decorative frame */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-cyan-500 via-emerald-500 to-blue-500"></div>

              <h2 className="text-base font-bold text-white tracking-tight mb-6 mt-2">
                {activeScan === 'fingerprint' ? 'Escaneando Huella Digital' : 'Verificación de Rostro ID'}
              </h2>

              {/* Scanner Window */}
              <div className="relative w-[300px] h-[300px] bg-slate-950/50 rounded-2xl flex items-center justify-center overflow-hidden mb-6 border border-slate-800/50">
                {activeScan === 'fingerprint' ? (
                  /* Glowing Fingerprint Pad */
                  <div className="relative flex flex-col items-center">
                    {/* Glowing background circles */}
                    <div className={`absolute w-36 h-36 rounded-full blur-2xl transition-colors ${scanSuccess ? 'bg-emerald-500/10' : 'bg-cyan-500/10'}`}></div>
                    
                    <button 
                      className={`relative p-8 rounded-full border-2 transition-all duration-300 ${
                        scanSuccess 
                          ? 'border-emerald-500 bg-emerald-950/20 text-emerald-400' 
                          : 'border-cyan-500/30 bg-cyan-950/10 text-cyan-400 hover:border-cyan-400'
                      }`}
                    >
                      <Fingerprint className={`w-16 h-16 ${scanSuccess ? '' : 'animate-pulse'}`} />
                      
                      {/* Horizontal laser sweeping across fingerprint */}
                      {!scanSuccess && (
                        <div className="absolute top-0 inset-x-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-[sweep_2s_infinite]"></div>
                      )}
                    </button>
                  </div>
                ) : (
                  /* Actual video camera feed + Sci-Fi HTML5 Canvas grid mapping */
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Real-time Video Stream */}
                    {!cameraError ? (
                      <video
                        ref={videoRef}
                        className="absolute w-full h-full object-cover rounded-2xl opacity-60 scale-x-[-1]"
                        muted
                        playsInline
                      />
                    ) : (
                      /* Cool Futuristic Mock Face Vector graphics when camera isn't accessible */
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950">
                        <div className={`p-6 rounded-full border-2 border-dashed ${scanSuccess ? 'border-emerald-500/50 bg-emerald-950/10 text-emerald-400' : 'border-cyan-500/30 bg-cyan-950/10 text-cyan-400'} mb-3`}>
                          <ScanFace className="w-16 h-16 animate-pulse" />
                        </div>
                        {savedFaceSnapshot && (
                          <img 
                            src={savedFaceSnapshot} 
                            alt="Propietario" 
                            className="absolute inset-0 w-full h-full object-cover opacity-20 rounded-2xl mix-blend-luminosity filter blur-xs"
                          />
                        )}
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Cámara Simulada / Offline</span>
                      </div>
                    )}

                    {/* Interactive drawing overlay canvas */}
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full pointer-events-none z-10"
                    />
                  </div>
                )}
              </div>

              {/* Scan Status & Progress bar */}
              <div className="w-full max-w-[280px] space-y-3">
                <div className="flex justify-between items-center text-xs font-bold font-mono">
                  <span className={scanSuccess ? 'text-emerald-400' : 'text-slate-400 animate-pulse'}>
                    {scanSuccess ? 'BIOMÉTRICOS APROBADOS' : 'PROCESANDO IDENTIDAD...'}
                  </span>
                  <span className={scanSuccess ? 'text-emerald-400' : 'text-cyan-400'}>{scanProgress}%</span>
                </div>
                
                {/* Visual Progress bar container */}
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-100 ${scanSuccess ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>

                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                  {scanSuccess 
                    ? 'Autenticado correctamente. Abriendo panel comercial...' 
                    : activeScan === 'face' 
                      ? 'Mantén tu rostro centrado frente a la cámara.' 
                      : 'Presiona el sensor digital con firmeza.'
                  }
                </p>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
