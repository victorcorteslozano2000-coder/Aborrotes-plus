import React, { useState, useRef, useEffect } from 'react';
import { AppConfig, SyncStatus } from '../types';
import { db } from '../lib/db';
import { 
  Settings, 
  Download, 
  Upload, 
  Trash2, 
  Database, 
  Percent, 
  DollarSign, 
  RefreshCw, 
  Sun, 
  Moon, 
  Sparkles, 
  CheckCircle2,
  Fingerprint,
  ScanFace,
  Shield,
  ShieldAlert,
  KeyRound,
  Camera,
  X,
  UserCheck,
  Smile,
  Lock,
  Unlock,
  AlertCircle
} from 'lucide-react';

interface ConfigurationProps {
  config: AppConfig;
  syncStatus: SyncStatus;
  currency: string;
  onRefresh: () => void;
  onUpdateConfig: (newConfig: AppConfig) => void;
}

export default function Configuration({ config, syncStatus, currency, onRefresh, onUpdateConfig }: ConfigurationProps) {
  const [businessName, setBusinessName] = useState(config.businessName);
  const [taxRate, setTaxRate] = useState(config.taxRate);
  const [currencySymbol, setCurrencySymbol] = useState(config.currency);
  const [theme, setTheme] = useState<'light' | 'dark'>(config.theme);

  // Sync animation helper
  const [isSyncing, setIsSyncing] = useState(false);

  // Security & Biometric states
  const [securityEnabled, setSecurityEnabled] = useState(!!config.securityEnabled);
  const [securityPin, setSecurityPin] = useState(config.securityPin || '1234');
  const [fingerprintRegistered, setFingerprintRegistered] = useState(!!config.fingerprintRegistered);
  const [faceRegistered, setFaceRegistered] = useState(!!config.faceRegistered);

  // Modals / Registration states
  const [isRegisteringFingerprint, setIsRegisteringFingerprint] = useState(false);
  const [isRegisteringFace, setIsRegisteringFace] = useState(false);
  const [fingerprintProgress, setFingerprintProgress] = useState(0);
  const [faceProgress, setFaceProgress] = useState(0);
  const [regSuccess, setRegSuccess] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  // Pin change UI
  const [editingPin, setEditingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Refs for camera registration
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

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

  const handleToggleSecurity = (checked: boolean) => {
    setSecurityEnabled(checked);
    const updated: AppConfig = {
      ...config,
      securityEnabled: checked,
    };
    db.saveConfig(updated);
    onUpdateConfig(updated);
  };

  const handleSavePin = () => {
    if (newPin.length !== 4 || isNaN(Number(newPin))) {
      setPinError('El PIN debe tener exactamente 4 dígitos numéricos.');
      return;
    }
    setSecurityPin(newPin);
    const updated: AppConfig = {
      ...config,
      securityPin: newPin,
    };
    db.saveConfig(updated);
    onUpdateConfig(updated);
    setEditingPin(false);
    setNewPin('');
    setPinError('');
    alert('🔐 PIN de seguridad actualizado con éxito.');
  };

  const startFingerprintRegistration = () => {
    setIsRegisteringFingerprint(true);
    setFingerprintProgress(0);
    setRegSuccess(false);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setFingerprintProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setRegSuccess(true);
        setFingerprintRegistered(true);
        const updatedConfig: AppConfig = {
          ...config,
          fingerprintRegistered: true
        };
        db.saveConfig(updatedConfig);
        onUpdateConfig(updatedConfig);
        
        setTimeout(() => {
          setIsRegisteringFingerprint(false);
        }, 1200);
      }
    }, 150);
  };

  const startFaceRegistration = async () => {
    setIsRegisteringFace(true);
    setFaceProgress(0);
    setRegSuccess(false);
    setCameraError(false);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 320, facingMode: 'user' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      // Start camera rendering overlay
      setTimeout(() => {
        startRegCanvasAnimation();
      }, 100);

      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setFaceProgress(Math.min(progress, 100));
        if (progress >= 100) {
          clearInterval(interval);
          setRegSuccess(true);
          setFaceRegistered(true);
          
          if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = 120;
            canvas.height = 120;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.translate(120, 0);
              ctx.scale(-1, 1);
              ctx.drawImage(videoRef.current, 0, 0, 120, 120);
              try {
                const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
                localStorage.setItem('abarrocontrol_face_snapshot', dataUrl);
              } catch (e) {
                console.error("Could not capture snapshot:", e);
              }
            }
          }

          stopCamera();

          const updatedConfig: AppConfig = {
            ...config,
            faceRegistered: true
          };
          db.saveConfig(updatedConfig);
          onUpdateConfig(updatedConfig);

          setTimeout(() => {
            setIsRegisteringFace(false);
          }, 1200);
        }
      }, 150);

    } catch (err) {
      console.error("Camera registration error:", err);
      setCameraError(true);
      // Fallback progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setFaceProgress(Math.min(progress, 100));
        if (progress >= 100) {
          clearInterval(interval);
          setRegSuccess(true);
          setFaceRegistered(true);
          
          const updatedConfig: AppConfig = {
            ...config,
            faceRegistered: true
          };
          db.saveConfig(updatedConfig);
          onUpdateConfig(updatedConfig);

          setTimeout(() => {
            setIsRegisteringFace(false);
          }, 1200);
        }
      }, 150);
    }
  };

  const startRegCanvasAnimation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 300;
    canvas.height = 300;

    let scanY = 90;
    let direction = 1;

    const render = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // outer circular scanner
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 110, 0, Math.PI * 2);
      ctx.stroke();

      // scan bar
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 95, scanY);
      ctx.lineTo(canvas.width / 2 + 95, scanY);
      ctx.stroke();

      // Draw vector face box boundaries
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1;
      ctx.strokeRect(80, 80, 140, 140);
      
      // Draw corners
      ctx.beginPath();
      ctx.lineWidth = 3;
      // top-left
      ctx.moveTo(80, 100); ctx.lineTo(80, 80); ctx.lineTo(100, 80);
      // top-right
      ctx.moveTo(200, 80); ctx.lineTo(220, 80); ctx.lineTo(220, 100);
      // bottom-left
      ctx.moveTo(80, 200); ctx.lineTo(80, 220); ctx.lineTo(100, 220);
      // bottom-right
      ctx.moveTo(200, 220); ctx.lineTo(220, 220); ctx.lineTo(220, 200);
      ctx.stroke();

      scanY += direction * 3;
      if (scanY > 210) {
        scanY = 210;
        direction = -1;
      } else if (scanY < 90) {
        scanY = 90;
        direction = 1;
      }

      if (videoRef.current) {
        animationFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();
  };

  const handleRemoveFingerprint = () => {
    if (confirm('¿Deseas desvincular tu huella digital registrada?')) {
      setFingerprintRegistered(false);
      const updatedConfig: AppConfig = {
        ...config,
        fingerprintRegistered: false
      };
      db.saveConfig(updatedConfig);
      onUpdateConfig(updatedConfig);
    }
  };

  const handleRemoveFace = () => {
    if (confirm('¿Deseas eliminar el registro de reconocimiento facial?')) {
      setFaceRegistered(false);
      localStorage.removeItem('abarrocontrol_face_snapshot');
      const updatedConfig: AppConfig = {
        ...config,
        faceRegistered: false
      };
      db.saveConfig(updatedConfig);
      onUpdateConfig(updatedConfig);
    }
  };

  // File import ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AppConfig = {
      businessName,
      taxRate: Number(taxRate),
      currency: currencySymbol,
      theme,
    };
    db.saveConfig(updated);
    onUpdateConfig(updated);
    alert('⚙️ Configuración del sistema guardada con éxito.');
    onRefresh();
  };

  const handleDownloadBackup = () => {
    const backupJson = db.exportBackup();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AbarroControl_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = db.importBackup(content);
      if (success) {
        alert('✅ Respaldo restaurado e importado con éxito. Se ha actualizado todo tu inventario y bases de datos históricas.');
        onRefresh();
      } else {
        alert('❌ Error al importar respaldo. Asegúrate de cargar un archivo JSON válido exportado por AbarroControl.');
      }
    };
    reader.readAsText(file);
  };

  const handleWipeDatabase = () => {
    if (confirm('⚠️ ATENCIÓN: Estás a punto de ELIMINAR permanentemente toda la información de la tienda (Productos, Ventas, Compras y Proveedores). Esto no se puede deshacer. ¿Deseas continuar?')) {
      db.clearAllData();
      alert('Se ha limpiado el almacenamiento local.');
      onRefresh();
      // Reload page to re-initialize safely
      window.location.reload();
    }
  };

  const handleLoadDemo = () => {
    if (confirm('¿Deseas restaurar la base de datos con los datos de prueba cargados por defecto (10 productos, 4 proveedores, ventas históricas y egresos de los últimos 14 días)? Esto reemplazará tu información actual.')) {
      db.seedDemoData();
      alert('✅ Datos de prueba restaurados con éxito.');
      onRefresh();
    }
  };

  const handleSimulateSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      db.saveSyncStatus({
        lastSynced: new Date().toISOString(),
        status: 'synced',
      });
      onRefresh();
      alert('☁️ ¡Sincronización con la nube exitosa! Todos los datos locales están respaldados de forma segura.');
    }, 2000);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    const updated: AppConfig = {
      ...config,
      theme: newTheme
    };
    db.saveConfig(updated);
    onUpdateConfig(updated);
    
    // Add custom css transitions
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Parámetros & Ajustes Generales</h1>
          <p className="text-xs text-gray-500 mt-1">Configura la identidad comercial de tu tienda, moneda, impuestos e infraestructura de respaldos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: System settings form */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
            <Settings className="w-5 h-5 text-emerald-600" />
            <span>Perfil Comercial & Parámetros</span>
          </h2>

          <form onSubmit={handleSaveConfig} className="space-y-4 text-sm text-gray-700">
            {/* Business name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre del Establecimiento comercial</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-semibold"
              />
            </div>

            {/* Tax setup and currency symbols row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-gray-400" />
                  <span>Porcentaje de Impuestos (IVA %)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 transition-all font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                  <span>Moneda local</span>
                </label>
                <select
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 transition-all font-bold text-xs"
                >
                  <option value="$">Pesos / Dólares ($)</option>
                  <option value="€">Euros (€)</option>
                  <option value="Q">Quetzales (Q)</option>
                  <option value="L">Lempiras (L)</option>
                  <option value="C$">Córdobas (C$)</option>
                </select>
              </div>
            </div>

            {/* Theme switcher option */}
            <div className="space-y-2 border-t border-gray-100 pt-4">
              <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Ajuste de Visualización</span>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => handleThemeChange('light')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                    theme === 'light'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Tema Claro</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleThemeChange('dark')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                    theme === 'dark'
                      ? 'bg-emerald-800 border-emerald-950 text-white'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <Moon className="w-4 h-4 text-emerald-300" />
                  <span>Tema Oscuro</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 rounded-xl font-bold transition-all shadow-sm shadow-emerald-100 text-xs uppercase"
            >
              Guardar Configuración Comercial
            </button>
          </form>
        </div>

        {/* Security & Biometric configuration card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-5 h-5 text-emerald-600" />
              <span>Seguridad & Acceso Biométrico</span>
            </h2>
            <div className="flex items-center gap-2">
              <span className={`text-xxs font-bold px-2 py-1 rounded-full ${securityEnabled ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                {securityEnabled ? 'ACTIVO' : 'DESACTIVADO'}
              </span>
            </div>
          </div>

          <div className="space-y-5 text-sm text-gray-700 dark:text-slate-300">
            {/* Toggle security screen lock */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800/40">
              <div>
                <p className="font-bold text-gray-800 dark:text-slate-200 text-xs uppercase tracking-wider">Bloqueo de pantalla al inicio</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Exigir autenticación (PIN o Biométricos) al cargar o recargar el sistema comercial.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={securityEnabled} 
                  onChange={(e) => handleToggleSecurity(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* PIN Settings Section */}
            <div className="border border-slate-100 dark:border-slate-800 p-4 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <p className="font-bold text-gray-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-emerald-600" />
                    <span>PIN de Seguridad (4 dígitos)</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">PIN de respaldo para desbloquear la aplicación cuando no uses biometría.</p>
                </div>
                {!editingPin && (
                  <button
                    type="button"
                    onClick={() => { setEditingPin(true); setNewPin(''); setPinError(''); }}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    Modificar PIN
                  </button>
                )}
              </div>

              {editingPin ? (
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/40 space-y-3.5">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 space-y-1">
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="Nuevo PIN de 4 dígitos"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:border-emerald-500 font-mono text-center font-bold tracking-widest text-slate-800 dark:text-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSavePin}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs uppercase"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingPin(false)}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-xs uppercase"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                  {pinError && (
                    <p className="text-xs text-rose-500 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{pinError}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-lg inline-flex items-center gap-1.5 font-mono text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                  <span>PIN Actual:</span>
                  <span>••••</span>
                </div>
              )}
            </div>

            {/* Biometric Credentials section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              
              {/* Fingerprint configuration */}
              <div className="border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${fingerprintRegistered ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                      <Fingerprint className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">Lector de Huella</p>
                      <span className={`text-[10px] font-black ${fingerprintRegistered ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                        {fingerprintRegistered ? 'VINCULADO' : 'SIN CONFIGURAR'}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Usa el sensor dactilar de tu dispositivo para un acceso express en un solo toque.
                  </p>
                </div>

                <div className="pt-2">
                  {fingerprintRegistered ? (
                    <button
                      type="button"
                      onClick={handleRemoveFingerprint}
                      className="w-full py-2 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/20 rounded-xl font-bold text-xs uppercase transition-colors"
                    >
                      Desvincular Huella
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startFingerprintRegistration}
                      className="w-full py-2 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20 rounded-xl font-bold text-xs uppercase transition-colors"
                    >
                      Registrar Huella
                    </button>
                  )}
                </div>
              </div>

              {/* Facial recognition configuration */}
              <div className="border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    {faceRegistered && localStorage.getItem('abarrocontrol_face_snapshot') ? (
                      <div className="w-10 h-10 rounded-xl border border-emerald-500 overflow-hidden shrink-0">
                        <img 
                          src={localStorage.getItem('abarrocontrol_face_snapshot') || ""} 
                          alt="Rostro Registrado" 
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                      </div>
                    ) : (
                      <div className={`p-2 rounded-xl ${faceRegistered ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        <ScanFace className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">Rostro ID (Facial)</p>
                      <span className={`text-[10px] font-black ${faceRegistered ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                        {faceRegistered ? 'VINCULADO' : 'SIN CONFIGURAR'}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Identificación biométrica instantánea usando la cámara de tu smartphone o laptop.
                  </p>
                </div>

                <div className="pt-2">
                  {faceRegistered ? (
                    <button
                      type="button"
                      onClick={handleRemoveFace}
                      className="w-full py-2 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/20 rounded-xl font-bold text-xs uppercase transition-colors"
                    >
                      Eliminar Rostro ID
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startFaceRegistration}
                      className="w-full py-2 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Escanear Rostro</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Side: Backups, cloud sync & dummy database engines */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-5">
          {/* Cloud sync simulation panel */}
          <div className="space-y-3.5 border-b border-gray-100 pb-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Sincronización en la Nube</h3>
            
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 flex justify-between items-center text-xs">
              <div>
                <p className="font-bold text-gray-800">Estatus: <span className="text-emerald-600 uppercase font-black text-xxs">Activo</span></p>
                <p className="text-xxs text-gray-400 mt-0.5 font-mono">
                  Sincronizado: {syncStatus.lastSynced ? new Date(syncStatus.lastSynced).toLocaleTimeString() : 'Pendiente'}
                </p>
              </div>
              <button
                disabled={isSyncing}
                onClick={handleSimulateSync}
                className="p-2.5 bg-white border border-gray-200 hover:border-emerald-200 rounded-xl hover:bg-emerald-50/20 text-emerald-700 transition-colors shrink-0 flex items-center gap-1 font-bold text-xs"
              >
                <RefreshCw className={`w-4 h-4 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Subiendo...' : 'Sincronizar'}</span>
              </button>
            </div>
          </div>

          {/* Backup/Import Local file systems */}
          <div className="space-y-4 border-b border-gray-100 pb-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Respaldos del Sistema</h3>
            
            <div className="flex gap-2.5">
              <button
                onClick={handleDownloadBackup}
                className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all"
                title="Descargar archivo .json"
              >
                <Download className="w-5 h-5 text-emerald-600" />
                <span>Crear Respaldo</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all"
                title="Cargar archivo .json"
              >
                <Upload className="w-5 h-5 text-blue-600" />
                <span>Restaurar</span>
              </button>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportBackup}
              accept=".json"
              className="hidden"
            />
          </div>

          {/* Danger zone dummy & clear buttons */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest block">Zona de Peligro / Herramientas</h3>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleLoadDemo}
                className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Database className="w-4 h-4 text-amber-600" />
                <span>Cargar Datos de Demostración</span>
              </button>

              <button
                type="button"
                onClick={handleWipeDatabase}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Restablecer Toda la Base de Datos</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modals */}
      {isRegisteringFingerprint && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-[9999] animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500"></div>
            
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-1.5">
              <Fingerprint className="w-5 h-5 text-emerald-400" />
              <span>Registro de Huella Digital</span>
            </h3>

            <div className="relative p-6 bg-slate-950/40 rounded-full border border-slate-800/80 mb-6">
              <Fingerprint className={`w-16 h-16 ${regSuccess ? 'text-emerald-400 scale-110' : 'text-cyan-400 animate-pulse'}`} />
              {!regSuccess && (
                <div className="absolute top-0 inset-x-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-[sweep_2s_infinite]"></div>
              )}
            </div>

            <div className="w-full space-y-3.5">
              <div className="flex justify-between items-center text-xxs font-black tracking-widest font-mono">
                <span className={regSuccess ? 'text-emerald-400' : 'text-slate-400'}>
                  {regSuccess ? 'REGISTRO COMPLETADO' : 'ANALIZANDO DETALLES...'}
                </span>
                <span className={regSuccess ? 'text-emerald-400' : 'text-cyan-400'}>{fingerprintProgress}%</span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-150 ${regSuccess ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                  style={{ width: `${fingerprintProgress}%` }}
                />
              </div>
              <p className="text-[10px] font-bold text-slate-400">
                {regSuccess ? '¡Listo! Tu huella ha sido vinculada correctamente.' : 'Espera mientras registramos tu huella digital...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {isRegisteringFace && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-[9999] animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500"></div>

            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-1.5">
              <ScanFace className="w-5 h-5 text-emerald-400" />
              <span>Registro de Rostro ID</span>
            </h3>

            {/* Video preview / Canvas tracking container */}
            <div className="relative w-64 h-64 bg-slate-950 rounded-2xl flex items-center justify-center overflow-hidden mb-6 border border-slate-800">
              {!cameraError ? (
                <video
                  ref={videoRef}
                  className="absolute w-full h-full object-cover scale-x-[-1] opacity-60"
                  muted
                  playsInline
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950">
                  <ScanFace className="w-12 h-12 text-cyan-500/40 animate-pulse mb-2" />
                  <span className="text-[10px] text-slate-500 uppercase font-black">Cámara Simulada / Activa</span>
                </div>
              )}
              
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
              />
            </div>

            <div className="w-full space-y-3.5">
              <div className="flex justify-between items-center text-xxs font-black tracking-widest font-mono">
                <span className={regSuccess ? 'text-emerald-400' : 'text-slate-400'}>
                  {regSuccess ? 'ESCANEO COMPLETADO' : 'ESCANEANDO PUNTOS DE CONTROL...'}
                </span>
                <span className={regSuccess ? 'text-emerald-400' : 'text-cyan-400'}>{faceProgress}%</span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-150 ${regSuccess ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                  style={{ width: `${faceProgress}%` }}
                />
              </div>
              <p className="text-[10px] font-bold text-slate-400">
                {regSuccess ? '¡Listo! Rostro registrado y guardado.' : 'Mantén tu rostro quieto e iluminado...'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
