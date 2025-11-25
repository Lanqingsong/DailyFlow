
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Unlock, ChevronRight, UserPlus, Users, ArrowLeft, CheckCircle2 } from 'lucide-react';

type Screen = 'select' | 'pin' | 'create';

const LoginScreen: React.FC = () => {
  const { login, createAccount, usersRegistry, switchAccount, lastActiveUserId, t } = useApp();
  const [screen, setScreen] = useState<Screen>('select');
  
  // Create Account State
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [lang, setLang] = useState<'zh' | 'en'>('zh');

  // Login State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  // Initial Logic
  useEffect(() => {
    // If we have a last active user, default to them
    if (lastActiveUserId && usersRegistry.some(u => u.id === lastActiveUserId)) {
        const user = usersRegistry.find(u => u.id === lastActiveUserId)!;
        switchAccount(user.id);
        setSelectedUserId(user.id);
        if (user.hasPin) {
            setScreen('pin');
        } else {
            // Auto login if no pin
            // The context handles auth logic when ID is set + no pin
        }
    } else {
        if (usersRegistry.length === 0) {
            setScreen('create');
        } else {
            setScreen('select');
        }
    }
  }, [usersRegistry, lastActiveUserId]);

  const selectedUser = usersRegistry.find(u => u.id === selectedUserId);

  const handleCreate = () => {
    if (newName.trim()) {
      createAccount(newName, lang, newPin.length === 4 ? newPin : undefined);
      // Auto logged in inside createAccount
    }
  };

  const handleSelectUser = (id: string, hasPin: boolean) => {
    switchAccount(id); // Set context ID, waiting for auth
    if (hasPin) {
      setSelectedUserId(id);
      setScreen('pin');
    } else {
      // Auto login handled by context
    }
  };

  const checkLogin = (inputPin: string) => {
     if (login(inputPin)) {
       setPin('');
     } else {
       setError(true);
       setTimeout(() => {
         setPin('');
         setError(false);
       }, 500);
     }
  };

  const handlePinSubmit = () => {
    checkLogin(pin);
  };

  const handleNumber = (num: number) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError(false);
      
      // Auto submit on 4th digit
      if (nextPin.length === 4) {
         // Tiny delay to show the last dot
         setTimeout(() => checkLogin(nextPin), 100);
      }
    }
  };

  // --- Render Views ---

  if (screen === 'create') {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col p-6">
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-3xl font-bold mb-2 text-primary">{t('login.create')}</h1>
          <p className="text-gray-500 mb-8">{t('login.new')}</p>

          <div className="space-y-4">
             <div>
               <label className="text-xs font-bold text-gray-400 uppercase">{t('login.name')}</label>
               <input 
                 type="text" 
                 value={newName}
                 onChange={e => setNewName(e.target.value)}
                 className="w-full border-b-2 border-gray-200 py-2 text-xl font-bold outline-none focus:border-primary"
                 placeholder="Alice"
               />
             </div>

             <div>
               <label className="text-xs font-bold text-gray-400 uppercase">{t('login.pinOpt')}</label>
               <input 
                 type="tel" 
                 maxLength={4}
                 value={newPin}
                 onChange={e => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                 className="w-full border-b-2 border-gray-200 py-2 text-xl font-bold outline-none focus:border-primary tracking-widest"
                 placeholder="0000"
               />
             </div>

             <div>
               <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">{t('prof.lang')}</label>
               <div className="flex gap-2">
                  <button onClick={() => setLang('zh')} className={`flex-1 py-3 rounded-xl border-2 font-bold ${lang === 'zh' ? 'border-primary text-primary bg-blue-50' : 'border-gray-100 text-gray-400'}`}>中文</button>
                  <button onClick={() => setLang('en')} className={`flex-1 py-3 rounded-xl border-2 font-bold ${lang === 'en' ? 'border-primary text-primary bg-blue-50' : 'border-gray-100 text-gray-400'}`}>English</button>
               </div>
             </div>
          </div>
        </div>

        <div className="space-y-3">
           <button 
            disabled={!newName}
            onClick={handleCreate}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
           >
             <CheckCircle2 /> {t('login.create')}
           </button>
           {usersRegistry.length > 0 && (
             <button onClick={() => setScreen('select')} className="w-full py-4 text-gray-400 font-bold">{t('login.back')}</button>
           )}
        </div>
      </div>
    );
  }

  if (screen === 'select') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col p-6">
         <div className="mt-12 mb-8">
            <h1 className="text-2xl font-bold text-slate-800">{t('login.select')}</h1>
         </div>

         <div className="grid grid-cols-2 gap-4">
            {usersRegistry.map(u => (
              <button 
                key={u.id}
                onClick={() => handleSelectUser(u.id, u.hasPin)}
                className="bg-white p-4 rounded-3xl shadow-sm flex flex-col items-center gap-3 hover:scale-105 transition-transform"
              >
                 <img src={u.avatar} className="w-16 h-16 rounded-full border-2 border-gray-100" />
                 <span className="font-bold text-slate-700">{u.name}</span>
                 {u.hasPin && <Lock size={14} className="text-gray-400" />}
              </button>
            ))}
            
            <button 
              onClick={() => setScreen('create')}
              className="bg-gray-200/50 border-2 border-dashed border-gray-300 p-4 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
            >
               <div className="bg-white p-3 rounded-full text-gray-400"><UserPlus size={24}/></div>
               <span className="font-bold text-gray-400 text-sm">{t('login.create')}</span>
            </button>
         </div>
      </div>
    );
  }

  // PIN Screen
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white relative">
      <button onClick={() => setScreen('select')} className="absolute top-12 left-6 p-2 bg-slate-800 rounded-full">
         <ArrowLeft size={20} />
      </button>

      <div className="mb-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4">
        <img src={selectedUser?.avatar} className="w-20 h-20 rounded-full border-4 border-slate-700 mb-4" />
        <h1 className="text-2xl font-bold">{selectedUser?.name}</h1>
        <div className={`mt-4 flex items-center gap-2 text-sm ${error ? 'text-red-400' : 'text-slate-400'}`}>
           {error ? 'Wrong PIN' : t('login.desc')}
        </div>
      </div>

      {/* PIN Dots */}
      <div className="flex gap-4 mb-12">
        {[0, 1, 2, 3].map(i => (
          <div 
            key={i} 
            className={`w-4 h-4 rounded-full transition-all ${i < pin.length ? 'bg-primary scale-110' : 'bg-slate-700'}`} 
          />
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-6 w-full max-w-xs">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button 
            key={num}
            onClick={() => handleNumber(num)}
            className="h-16 w-16 rounded-full bg-slate-800 hover:bg-slate-700 text-2xl font-bold flex items-center justify-center transition-colors"
          >
            {num}
          </button>
        ))}
        <button 
          onClick={() => setPin(prev => prev.slice(0, -1))}
          className="h-16 w-16 rounded-full text-slate-400 font-bold flex items-center justify-center hover:text-white"
        >
          Del
        </button>
        <button 
          onClick={() => handleNumber(0)}
          className="h-16 w-16 rounded-full bg-slate-800 hover:bg-slate-700 text-2xl font-bold flex items-center justify-center"
        >
          0
        </button>
        <button 
           onClick={handlePinSubmit}
           disabled={pin.length !== 4}
           className={`h-16 w-16 rounded-full flex items-center justify-center transition-colors ${pin.length === 4 ? 'bg-primary text-white' : 'bg-slate-800 text-slate-600'}`}
        >
          <ChevronRight size={28} />
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
