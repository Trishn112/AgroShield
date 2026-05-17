import * as React from 'react';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Leaf, ShieldAlert, CheckCircle2, Search, History, Trash2, ArrowRight, Camera, X, RefreshCw, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { analyzeCropDisease } from '@/services/ai';
import { auth, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/languageStore';

export default function CropAnalysis() {
  const { t } = useLanguage();
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      toast.error("Could not access camera.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const processFile = (file: File | undefined) => {
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setResult(null);
    try {
      const analysis = await analyzeCropDisease(image);
      setResult(analysis);
      
      if (auth.currentUser) {
        try {
          // Compress image for storage if it's too large or just as a precaution
          let storageImage = image;
          if (image.length > 500000) { // If > 500KB Base64
            storageImage = await compressImage(image, 0.4);
          }

          await addDoc(collection(db, 'crops'), {
            userId: auth.currentUser.uid,
            imageUrl: storageImage,
            ...analysis,
            createdAt: new Date().toISOString()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'crops');
        }
      }
      toast.success("Analysis complete!");
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.message || "Analysis failed. Please try again.";
      toast.error(errorMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const compressImage = (base64: string, quality: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const MAX_WIDTH = 600;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-20 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Upload Zone */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">{t('crop.title')}</h1>
            <p className="text-zinc-400">{t('crop.desc')}</p>
          </div>

          <div 
            className={`relative group transition-all duration-300 ${isDragging ? 'scale-[1.02]' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className={`absolute inset-0 bg-emerald-500/10 blur-[60px] transition-opacity duration-300 ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>
            <div className={`relative aspect-square rounded-[40px] border-2 border-dashed overflow-hidden flex flex-col items-center justify-center p-8 text-center transition-all ${isDragging ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/10 bg-zinc-900 hover:border-emerald-500/50'}`}>
              {image ? (
                <div className="w-full h-full relative group">
                  <img src={image} className="w-full h-full object-cover rounded-3xl" alt="Preview" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" size="sm" onClick={() => setImage(null)} className="bg-white/10 backdrop-blur-md border-white/20 text-white">
                      <Trash2 className="w-4 h-4 mr-2" /> {t('crop.replacePhoto')}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${isDragging ? 'bg-emerald-500 text-white scale-110' : 'bg-white/5 text-emerald-500'}`}>
                    <Upload className="w-8 h-8" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">
                    {isDragging ? t('crop.dropText') : t('crop.dragText')}
                  </h3>
                  <p className="text-zinc-500 text-sm mb-8">{t('crop.uploadGuidelines')}</p>
                  
                  <div className="flex flex-wrap justify-center gap-4">
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                    />
                    <Button 
                      variant="default" 
                      className="bg-emerald-600 hover:bg-emerald-500 rounded-full px-8"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {t('crop.selectImage')}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-emerald-500/50 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-full px-8 flex items-center gap-2"
                      onClick={startCamera}
                    >
                      <Camera className="w-4 h-4" />
                      {t('crop.instantPhoto')}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          <Button 
            size="lg" 
            className="w-full h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed group transition-all"
            disabled={!image || isAnalyzing}
            onClick={handleAnalyze}
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin" />
                {t('crop.scanningNeural')}
              </span>
            ) : (
              <span className="flex items-center gap-3">
                <Search className="w-6 h-6" />
                {t('crop.analyzeHealth')}
              </span>
            )}
          </Button>
        </div>

        {/* Right: Results / History */}
        <div className="space-y-8">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="bg-zinc-900 border-emerald-500/30 overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                  <div className="bg-emerald-500/10 p-6 border-b border-emerald-500/20 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="text-white w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-xl">{t('crop.diagnosisComplete')}</CardTitle>
                        <CardDescription className="text-emerald-500/70 font-medium italic">{(result.confidence * 100).toFixed(1)}% {t('crop.confidenceScore')}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className={`
                      px-4 py-1 rounded-full uppercase tracking-tighter font-black
                      ${result.severity === 'high' ? 'bg-orange-500/20 text-orange-500 border-orange-500/30' : 
                        result.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' : 
                        'bg-emerald-500/20 text-emerald-500 border-emerald-500/20'}
                    `}>
                      {result.severity} {t('crop.risk')}
                    </Badge>
                  </div>
                  <CardContent className="p-8 space-y-8">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest">{result.pathogenType}</Badge>
                      </div>
                      <div className="text-3xl font-black text-white leading-tight">{result.disease}</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                          <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2 block">Observed Symptoms</label>
                          <p className="text-zinc-300 text-xs leading-relaxed">{result.symptoms}</p>
                       </div>
                       <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                          <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2 block">Probable Causes</label>
                          <p className="text-zinc-300 text-xs leading-relaxed">{result.causes}</p>
                       </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-white">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <h4 className="text-sm font-bold uppercase tracking-widest">{t('crop.treatmentProtocol')}</h4>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="bg-emerald-500/5 rounded-2xl p-5 border border-emerald-500/10 transition-all hover:bg-emerald-500/10">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{t('crop.immediateAction')}</span>
                          </div>
                          <p className="text-zinc-300 text-sm leading-relaxed">{result.solution.immediate}</p>
                        </div>

                        <div className="bg-blue-500/5 rounded-2xl p-5 border border-blue-500/10 transition-all hover:bg-blue-500/10">
                          <div className="flex items-center gap-2 mb-2">
                            <Info className="w-3 h-3 text-blue-400" />
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{t('crop.longTermPrevention')}</span>
                          </div>
                          <p className="text-zinc-300 text-sm leading-relaxed">{result.solution.longTerm}</p>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full bg-white text-black hover:bg-zinc-200 rounded-full py-6 font-bold group">
                      {t('crop.orderKit')}
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col justify-center items-center text-center p-12 border-2 border-dashed border-white/5 rounded-[40px] bg-zinc-950/50"
              >
                <div className="w-24 h-24 rounded-[32px] overflow-hidden mb-8 rotate-3 shadow-2xl opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                  <img src="/logo.png" alt="Logo Placeholder" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-zinc-500 font-bold text-xl mb-4 italic">{t('crop.standbyTitle')}</h3>
                <p className="text-zinc-600 text-sm max-w-xs">
                  {t('crop.standbyDesc')}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Camera Modal */}
      <AnimatePresence>
        {isCameraOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4"
          >
            <div className="w-full max-w-2xl relative aspect-[3/4] bg-zinc-900 rounded-[40px] overflow-hidden border border-white/10">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-8">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={stopCamera}
                  className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-xl border-white/10 text-white hover:bg-white/10"
                >
                  <X className="w-6 h-6" />
                </Button>
                
                <button 
                  onClick={capturePhoto}
                  className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group"
                >
                  <div className="w-16 h-16 bg-white rounded-full scale-100 group-active:scale-90 transition-transform" />
                </button>
                
                <div className="w-14" /> {/* Spacer */}
              </div>
            </div>
            <p className="text-zinc-500 mt-8 font-medium">Position your crop in the frame</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

