import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../constants';
import { CategoryId } from '../types';
import { Mic, Square, Camera, Plus, CheckCircle2, Repeat, Hash, Clock, AlignLeft, X, FlipHorizontal } from 'lucide-react';

type Mode = 'record' | 'plan';

const EntryForm: React.FC = () => {
  const { subCategories, addSubCategory, addRecord, addPlan, addRecurringPlan, setIsPickingFile, t, user } = useApp();
  
  const [mode, setMode] = useState<Mode>('record');
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('exercise');
  const [selectedSub, setSelectedSub] = useState<string>('');
  
  // Values
  const [duration, setDuration] = useState<number>(30);
  const [metricValue, setMetricValue] = useState<string>(''); // For weight, reps etc.
  const [note, setNote] = useState('');
  
  // Custom Subcategory State
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customName, setCustomName] = useState('');

  // Recurring Plan State
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]); // 0-6

  // Media State
  const [images, setImages] = useState<string[]>([]);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Camera State
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fallbackCameraInputRef = useRef<HTMLInputElement>(null);

  // UI Feedback
  const [showSuccess, setShowSuccess] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const currentSubs = subCategories.filter(s => s.categoryId === selectedCategory);
  const activeCategory = CATEGORIES.find(c => c.id === selectedCategory);
  
  // Active Sub Config
  const activeSubConfig = subCategories.find(s => s.id === selectedSub);
  const measureType = activeSubConfig?.measureType || 'time';

  const [tip, setTip] = useState('');

  // Helper for names
  const getSubName = (s: any) => t(`sub.${s.id}`) === `sub.${s.id}` ? s.name : t(`sub.${s.id}`);
  const getCatName = (id: string) => t(`cat.${id}`) || id;

  useEffect(() => {
    if (activeCategory && activeCategory.tips && activeCategory.tips.length > 0) {
      setTip(activeCategory.tips[Math.floor(Math.random() * activeCategory.tips.length)]);
    }
  }, [selectedCategory, activeCategory]);

  // --- Keyboard Handling (iOS Optimized) ---
  const handleInputFocus = (e: React.FocusEvent<HTMLElement>) => {
    const target = e.target;
    // Wait for keyboard animation to start (iOS ~300ms)
    setTimeout(() => {
      // 1. Ensure the container can scroll
      if (containerRef.current) {
         // 2. Scroll element to center
         target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 400);
  };

  const toggleCamera = async () => {
    if (showCamera) {
      // Close Camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setShowCamera(false);
      setIsPickingFile(false); // Enable lock again
    } else {
      // Open Camera
      setIsPickingFile(true); // Disable lock
      try {
        // Try to access native camera stream first
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } // Prefer rear camera
        });
        streamRef.current = stream;
        setShowCamera(true);
        // Need to wait for render
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }, 100);
      } catch (err) {
        console.warn("Camera stream failed, falling back to file input", err);
        // FALLBACK: If permission denied or HTTP (not HTTPS), use Native File Picker
        // Close the stream UI just in case
        setShowCamera(false);
        // Trigger the hidden file input
        fallbackCameraInputRef.current?.click();
      }
    }
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
        
        // Compress photo logic
        const MAX_DIM = 800;
        let w = canvas.width;
        let h = canvas.height;
        if (w > h && w > MAX_DIM) {
            h *= MAX_DIM/w;
            w = MAX_DIM;
        } else if (h > MAX_DIM) {
            w *= MAX_DIM/h;
            h = MAX_DIM;
        }
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx?.drawImage(canvas, 0, 0, w, h);

        const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.6);
        setImages(prev => [...prev, dataUrl]);
        toggleCamera(); // Close after capture
      }
    }
  };

  // Fallback for when getUserMedia fails (e.g. no permissions or non-secure context)
  const handleFallbackCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPickingFile(false);
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        // Compress the uploaded image
        const img = new Image();
        img.onload = () => {
             const canvas = document.createElement('canvas');
             const MAX_DIM = 800;
             let w = img.width;
             let h = img.height;
             
             if (w > h && w > MAX_DIM) {
                 h *= MAX_DIM/w;
                 w = MAX_DIM;
             } else if (h > MAX_DIM) {
                 w *= MAX_DIM/h;
                 h = MAX_DIM;
             }

             canvas.width = w;
             canvas.height = h;
             const ctx = canvas.getContext('2d');
             ctx?.drawImage(img, 0, 0, w, h);
             const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
             setImages(prev => [...prev, dataUrl]);
        };
        img.src = evt.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      setIsPickingFile(false);
    } else {
      setIsPickingFile(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            setAudioData(reader.result as string);
          };
          reader.readAsDataURL(blob);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        setIsPickingFile(false);
        alert(t('entry.micErr'));
      }
    }
  };

  const handleAddCustomSub = () => {
    if (customName.trim()) {
      addSubCategory(selectedCategory, customName);
      setCustomName('');
      setIsAddingCustom(false);
    }
  };

  const toggleDay = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter(d => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex]);
    }
  };

  const handleSubmit = () => {
    if (!selectedSub) {
        alert(t('entry.selectAct'));
        return;
    }

    if (mode === 'record') {
      if (date > todayStr) {
        alert(t('entry.futureErr'));
        return;
      }

      const mediaList = [];
      images.forEach(img => mediaList.push({ type: 'image' as const, data: img, timestamp: Date.now() }));
      if (audioData) mediaList.push({ type: 'audio' as const, data: audioData, timestamp: Date.now() });

      let finalDuration = 0;
      let finalValue = undefined;

      if (measureType === 'time') {
        finalDuration = duration;
      } else if (measureType === 'number') {
        finalValue = parseFloat(metricValue);
      }

      addRecord({
        date,
        categoryId: selectedCategory,
        subCategoryId: selectedSub,
        durationMinutes: finalDuration,
        metricValue: finalValue,
        metricUnit: activeSubConfig?.unit,
        note,
        media: mediaList
      });

      setNote('');
      setImages([]);
      setAudioData(null);
      setMetricValue('');
    } else {
      const targetMin = measureType === 'time' ? duration : 0; 
      
      if (isRecurring) {
        if (selectedDays.length === 0) {
          alert(t('entry.selectDays'));
          return;
        }
        addRecurringPlan({
          categoryId: selectedCategory,
          subCategoryId: selectedSub,
          daysOfWeek: selectedDays,
          targetDurationMinutes: targetMin
        });
      } else {
        addPlan({
          date,
          categoryId: selectedCategory,
          subCategoryId: selectedSub,
          targetDurationMinutes: targetMin
        });
      }
    }

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DAYS_ZH = ['日', '一', '二', '三', '四', '五', '六'];
  const DAYS = user.language === 'zh' ? DAYS_ZH : DAYS_EN;

  return (
    // Use h-[100dvh] for mobile browsers to properly handle address bar resizing
    // Added pt-safe for notch support if needed at top
    <div ref={containerRef} className="h-[100dvh] flex flex-col overflow-y-auto bg-gray-50 pb-safe">
      <div className="flex-1 p-6 space-y-6 pb-32">
        {/* Hidden Fallback Input for Camera */}
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          ref={fallbackCameraInputRef}
          className="hidden"
          onChange={handleFallbackCameraChange}
        />

        {/* Camera Overlay */}
        {showCamera && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="absolute bottom-10 flex gap-8 items-center">
                  <button onClick={toggleCamera} className="bg-white/20 p-4 rounded-full backdrop-blur-md">
                      <X className="text-white" size={30} />
                  </button>
                  <button onClick={capturePhoto} className="bg-white p-5 rounded-full border-4 border-gray-300 shadow-xl active:scale-95 transition-transform">
                      <div className="w-12 h-12 bg-gray-100 rounded-full border-2 border-gray-400"></div>
                  </button>
              </div>
          </div>
        )}

        {/* Success Toast */}
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-xl transition-all duration-300 z-50 flex items-center gap-2 ${showSuccess ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}`}>
          <CheckCircle2 className="text-green-400" size={20} />
          <span className="font-bold text-sm">{t('entry.saved')}</span>
        </div>

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            {mode === 'record' ? t('entry.logTitle') : t('entry.planTitle')}
          </h1>
        </div>
        
        {/* Mode Toggle */}
        <div className="flex bg-gray-200 rounded-xl p-1">
          <button 
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${mode === 'record' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
            onClick={() => setMode('record')}
          >
            {t('entry.checkin')}
          </button>
          <button 
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${mode === 'plan' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
            onClick={() => setMode('plan')}
          >
            {t('entry.futurePlan')}
          </button>
        </div>

        {/* Date Picker */}
        {(!isRecurring || mode === 'record') && (
          <div className="bg-white p-4 rounded-2xl shadow-sm">
            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">{t('entry.date')}</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              max={mode === 'record' ? todayStr : undefined}
              className="w-full p-2 bg-gray-50 rounded-xl text-lg font-bold text-gray-800 outline-none"
            />
          </div>
        )}

        {/* Recurring Selector */}
        {mode === 'plan' && (
          <div className="bg-white p-4 rounded-2xl shadow-sm">
             <div className="flex items-center justify-between mb-3">
               <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                 <Repeat size={14}/> {t('entry.recurring')}
               </label>
               <button 
                  onClick={() => setIsRecurring(!isRecurring)} 
                  className={`w-12 h-6 rounded-full transition-colors relative ${isRecurring ? 'bg-primary' : 'bg-gray-200'}`}
               >
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isRecurring ? 'translate-x-6' : ''}`}></div>
               </button>
             </div>
             
             {isRecurring && (
               <div className="flex justify-between mt-4">
                 {DAYS.map((day, idx) => (
                   <button 
                     key={idx}
                     onClick={() => toggleDay(idx)}
                     className={`w-9 h-9 rounded-full text-xs font-bold transition-all ${selectedDays.includes(idx) ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}
                   >
                     {day}
                   </button>
                 ))}
               </div>
             )}
          </div>
        )}

        {/* Category Selection */}
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); setSelectedSub(''); }}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all border-2 ${selectedCategory === cat.id ? 'border-primary bg-primary/5' : 'border-transparent bg-white'}`}
            >
               <div className={`w-8 h-8 rounded-full ${cat.color} mb-2`}></div>
               <span className="text-[10px] font-bold text-gray-600">{getCatName(cat.id)}</span>
            </button>
          ))}
        </div>
        
        {/* Category Tip */}
        <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-start gap-2">
           <div className="text-lg">💡</div>
           <p className="text-xs text-indigo-800 italic leading-relaxed">
             {tip}
           </p>
        </div>

        {/* Subcategory Selection */}
        <div className="bg-white p-4 rounded-2xl shadow-sm">
           <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-bold text-gray-400 uppercase">{t('entry.activityType')}</label>
              <button onClick={() => setIsAddingCustom(!isAddingCustom)} className="text-primary text-xs font-bold flex items-center">
                <Plus size={14} className="mr-1"/> {t('entry.addNew')}
              </button>
           </div>
           
           {isAddingCustom && (
             <div className="flex gap-2 mb-4">
               <input 
                 type="text" 
                 value={customName} 
                 onChange={(e) => setCustomName(e.target.value)} 
                 placeholder={t('entry.placeholder')}
                 onFocus={handleInputFocus}
                 className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
               />
               <button onClick={handleAddCustomSub} className="bg-primary text-white px-4 rounded-lg text-sm font-bold">{t('entry.add')}</button>
             </div>
           )}

           <div className="flex flex-wrap gap-2">
             {currentSubs.map(sub => (
               <button
                  key={sub.id}
                  onClick={() => setSelectedSub(sub.id)}
                  className={`px-4 py-2 rounded-full text-xs font-medium border flex items-center gap-2 ${selectedSub === sub.id ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
               >
                 {sub.measureType === 'number' && <Hash size={12}/>}
                 {sub.measureType === 'text' && <AlignLeft size={12}/>}
                 {sub.measureType === 'time' && <Clock size={12}/>}
                 {getSubName(sub)}
               </button>
             ))}
           </div>
        </div>

        {/* Details Form - DYNAMIC based on MeasureType */}
        <div className="bg-white p-4 rounded-2xl shadow-sm space-y-4">
           
           {/* CASE 1: TIME (Duration Slider) */}
           {measureType === 'time' && (
             <div>
               <label className="text-xs font-bold text-gray-400 uppercase block mb-1">
                 {mode === 'record' ? t('entry.timeSpent') : t('entry.targetTime')}
               </label>
               <input 
                 type="range" min="0" max="180" step="5" 
                 value={duration} 
                 onChange={(e) => setDuration(Number(e.target.value))}
                 className="w-full accent-primary"
               />
               <div className="text-center font-bold text-xl text-gray-800 mt-1">{duration} min</div>
             </div>
           )}

           {/* CASE 2: NUMBER */}
           {measureType === 'number' && mode === 'record' && (
             <div>
                <label className="text-xs font-bold text-gray-400 uppercase block mb-1">
                  {t('entry.value')} ({activeSubConfig?.unit || 'Units'})
                </label>
                <input 
                  type="number" 
                  value={metricValue}
                  onChange={(e) => setMetricValue(e.target.value)}
                  onFocus={handleInputFocus}
                  placeholder={`Enter ${activeSubConfig?.unit || 'value'}`}
                  className="w-full bg-gray-50 p-3 rounded-xl text-xl font-bold outline-none text-center"
                />
             </div>
           )}

           {/* CASE 3: TEXT */}
           {measureType === 'text' && mode === 'record' && (
             <p className="text-sm text-gray-500 italic text-center">{t('entry.desc')}</p>
           )}

           {/* Common: Note & Media (Only Record Mode) */}
           {mode === 'record' && (
             <>
               <div>
                  <label className="text-xs font-bold text-gray-400 uppercase block mb-1">
                    {measureType === 'text' ? t('entry.content') : t('entry.note')}
                  </label>
                  <textarea 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onFocus={handleInputFocus}
                    placeholder={measureType === 'text' ? t('entry.desc') : t('entry.how')}
                    className="w-full bg-gray-50 p-3 rounded-xl text-sm outline-none h-24 resize-none focus:ring-2 ring-primary/20"
                  />
               </div>

               <div className="flex gap-4">
                  <button 
                    onClick={toggleCamera}
                    className="flex-1 bg-blue-50 text-blue-600 p-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-blue-100 transition-colors"
                  >
                    <Camera size={20} />
                    <span className="text-sm font-bold">{t('entry.photo')}</span>
                  </button>

                  <button 
                    onClick={toggleRecording}
                    className={`flex-1 p-3 rounded-xl flex items-center justify-center gap-2 transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
                  >
                    {isRecording ? <Square size={20} /> : <Mic size={20} />}
                    <span className="text-sm font-bold">{isRecording ? t('entry.stop') : t('entry.record')}</span>
                  </button>
               </div>
               
               {images.length > 0 && (
                 <div className="flex gap-2 overflow-x-auto py-2">
                   {images.map((img, i) => (
                     <div key={i} className="relative group flex-shrink-0">
                        <img src={img} className="h-16 w-16 rounded-lg object-cover border border-gray-200" alt="preview" />
                        <button 
                          onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                        >
                          <X size={10} />
                        </button>
                     </div>
                   ))}
                 </div>
               )}
               {audioData && (
                 <div className="bg-gray-100 p-2 rounded-lg relative">
                    <button onClick={() => setAudioData(null)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"><X size={12}/></button>
                    <audio controls src={audioData} className="w-full h-8" />
                 </div>
               )}
             </>
           )}
        </div>

        <button 
          onClick={handleSubmit} 
          className="w-full bg-gray-800 text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={24} />
          {mode === 'record' ? t('entry.saveEntry') : t('entry.savePlan')}
        </button>
      </div>
    </div>
  );
};

export default EntryForm;