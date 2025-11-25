
import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { LogOut, Download, Upload, Trash, UserCircle, Shield, HelpCircle, Code, FileText, ChevronDown, ChevronUp, Lock, Edit2, Check, Globe, Camera, Users, AlertTriangle } from 'lucide-react';
import { Language } from '../translations';
import { APP_VERSION } from '../constants';

const Profile: React.FC = () => {
  const { user, exportData, importData, resetData, logout, switchAccount, deleteAccount, updateUser, setLanguage, currentLanguage, setIsPickingFile, t } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // UI States
  const [showHelp, setShowHelp] = useState(false);
  const [showDev, setShowDev] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [securityMode, setSecurityMode] = useState(false);
  const [newPin, setNewPin] = useState('');

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dailyflow-${user.name}-backup.json`;
    link.click();
  };

  const handleImportTrigger = () => {
    setIsPickingFile(true);
    fileInputRef.current?.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPickingFile(false); // Reset lock guard
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const content = evt.target?.result as string;
        if (importData(content)) {
          alert(t('prof.imported'));
        } else {
          alert(t('prof.invalid'));
        }
      };
      reader.readAsText(file);
    }
  };

  const handleAvatarTrigger = () => {
    setIsPickingFile(true);
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPickingFile(false);
    const file = e.target.files?.[0];
    if (file) {
      // 1. Check file size first (limit 5MB input)
      if (file.size > 5 * 1024 * 1024) {
          alert("Image too large. Please select a smaller image.");
          return;
      }

      // 2. Compress/Resize Image using Canvas
      const reader = new FileReader();
      reader.onload = (evt) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 150; // Resize to 150px
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Export as low quality JPEG to save space
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          updateUser({ avatar: dataUrl });
        };
        img.src = evt.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAccount = () => {
      if (confirm(t('prof.deleteAccConfirm'))) {
          if (user.id) {
              deleteAccount(user.id);
          }
      }
  };

  const handleReset = () => {
    if (confirm(t('prof.deleteConfirm'))) {
      resetData();
    }
  };

  const saveProfile = () => {
    updateUser({ name: editName });
    setIsEditing(false);
  };

  const savePin = () => {
    if (newPin.length === 4) {
      updateUser({ pin: newPin });
      setSecurityMode(false);
      alert(t('prof.pinSet'));
    } else if (newPin === '') {
       updateUser({ pin: undefined });
       setSecurityMode(false);
       alert(t('prof.pinRemoved'));
    } else {
      alert(t('prof.pinErr'));
    }
  };

  return (
    <div className="p-6 space-y-6 pb-24 overflow-y-auto h-full">
      <h1 className="text-2xl font-bold text-gray-800">{t('prof.title')}</h1>

      {/* Account Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-10"></div>
         <div className="relative flex flex-col items-center z-10">
            <div className="relative mb-3 group">
               <img src={user.avatar} alt="User" className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-white object-cover" />
               <button 
                  onClick={handleAvatarTrigger}
                  className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow hover:bg-indigo-600 transition-colors"
                >
                 <Camera size={16} />
               </button>
               <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
            </div>
            
            {isEditing ? (
              <div className="flex items-center gap-2 mb-2">
                <input 
                  type="text" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)}
                  className="border-b-2 border-primary outline-none text-center font-bold text-lg w-32"
                />
                <button onClick={saveProfile} className="text-green-500"><Check size={20}/></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1">
                 <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
                 <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-primary"><Edit2 size={14}/></button>
              </div>
            )}
            
            <p className="text-gray-500 text-xs bg-gray-100 px-3 py-1 rounded-full">
              {user.pin ? `🔒 ${t('prof.secured')}` : `🔓 ${t('prof.public')}`}
            </p>
         </div>
      </div>

      {/* Account Actions (Switch / Lock) */}
      <div className="grid grid-cols-2 gap-4">
         <button 
           onClick={() => switchAccount(null)}
           className="bg-white p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-gray-50"
         >
           <div className="bg-blue-50 p-2 rounded-full text-blue-600"><Users size={20}/></div>
           <span className="text-xs font-bold text-gray-700">{t('prof.switchAcc')}</span>
         </button>

         <button 
           onClick={logout}
           className="bg-white p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-gray-50"
         >
           <div className="bg-indigo-50 p-2 rounded-full text-indigo-600"><Lock size={20}/></div>
           <span className="text-xs font-bold text-gray-700">{t('prof.logout')}</span>
         </button>
      </div>

      {/* Language Section */}
      <div className="space-y-2">
         <h3 className="text-xs font-bold text-gray-400 uppercase ml-2">{t('prof.lang')}</h3>
         <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex items-center p-2">
             <div className="bg-blue-50 p-2 rounded-xl text-blue-600 mr-3 ml-2"><Globe size={20}/></div>
             <span className="font-medium text-gray-700 flex-1">{t('prof.switch')}</span>
             <div className="flex bg-gray-100 rounded-lg p-1 mr-2">
                <button 
                  onClick={() => setLanguage('zh')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${currentLanguage === 'zh' ? 'bg-white shadow text-primary' : 'text-gray-400'}`}
                >
                  中文
                </button>
                <button 
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${currentLanguage === 'en' ? 'bg-white shadow text-primary' : 'text-gray-400'}`}
                >
                  EN
                </button>
             </div>
         </div>
      </div>

      {/* Security Section */}
      <div className="space-y-2">
         <h3 className="text-xs font-bold text-gray-400 uppercase ml-2">{t('prof.security')}</h3>
         <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button 
              onClick={() => setSecurityMode(!securityMode)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600"><Shield size={20}/></div>
                <span className="font-medium text-gray-700">{t('prof.appLock')}</span>
              </div>
              <ChevronDown size={16} className={`transition-transform ${securityMode ? 'rotate-180' : ''}`} />
            </button>
            
            {securityMode && (
              <div className="p-4 bg-gray-50 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                 <p className="text-xs text-gray-500 mb-2">{t('prof.pinDesc')}</p>
                 <div className="flex gap-2">
                   <input 
                     type="text" 
                     maxLength={4}
                     placeholder="0000"
                     value={newPin}
                     onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                     className="flex-1 p-2 rounded-lg border border-gray-300 text-center tracking-widest font-bold"
                   />
                   <button onClick={savePin} className="bg-primary text-white px-4 rounded-lg font-bold text-sm">{t('prof.save')}</button>
                 </div>
              </div>
            )}
         </div>
      </div>

      {/* Help Section */}
      <div className="space-y-2">
         <h3 className="text-xs font-bold text-gray-400 uppercase ml-2">{t('prof.support')}</h3>
         <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button 
              onClick={() => setShowHelp(!showHelp)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="bg-orange-50 p-2 rounded-xl text-orange-600"><HelpCircle size={20}/></div>
                <span className="font-medium text-gray-700">{t('prof.guide')}</span>
              </div>
              {showHelp ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
            </button>
            
            {showHelp && (
              <div className="p-4 bg-gray-50 border-t border-gray-100 text-sm text-gray-600 space-y-3">
                 <div>
                   <span className="font-bold text-gray-800 block">🏠 {t('nav.home')}</span>
                   {t('prof.guide.home')}
                 </div>
                 <div>
                   <span className="font-bold text-gray-800 block">📅 {t('nav.calendar')}</span>
                   {t('prof.guide.cal')}
                 </div>
                 <div>
                   <span className="font-bold text-gray-800 block">➕ {t('nav.add')}</span>
                   {t('prof.guide.add')}
                 </div>
                 <div>
                   <span className="font-bold text-gray-800 block">🔄 {t('nav.profile')}</span>
                   {t('prof.guide.acc')}
                 </div>
              </div>
            )}
            
            <button 
              onClick={() => setShowDev(!showDev)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 border-t border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><Code size={20}/></div>
                <span className="font-medium text-gray-700">{t('prof.dev')}</span>
              </div>
            </button>

            {showDev && (
               <div className="p-4 bg-gray-50 border-t border-gray-100 text-sm text-center">
                  <p className="font-bold text-gray-800">{t('prof.devName')}</p>
                  <p className="text-primary font-mono bg-white inline-block px-2 py-1 rounded border border-blue-100 mt-1 select-all">
                    87495727@qq.com
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">{t('prof.license')}</p>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      {t('prof.licenseDesc')}
                      <br/>
                      Copyright (c) 2024 DailyFlow
                    </p>
                  </div>
               </div>
            )}
         </div>
      </div>

      {/* Data Management */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase ml-2">{t('prof.data')}</h3>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <button onClick={handleExport} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 border-b border-gray-100">
             <div className="flex items-center gap-3">
                <div className="bg-green-50 p-2 rounded-xl text-green-600"><Download size={20}/></div>
                <span className="font-medium text-gray-700">{t('prof.export')}</span>
             </div>
          </button>

          <button onClick={handleImportTrigger} className="w-full p-4 flex items-center justify-between hover:bg-gray-50">
             <div className="flex items-center gap-3">
                <div className="bg-purple-50 p-2 rounded-xl text-purple-600"><Upload size={20}/></div>
                <span className="font-medium text-gray-700">{t('prof.import')}</span>
             </div>
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
        </div>
        
        <button onClick={handleReset} className="w-full bg-red-50 p-4 rounded-2xl shadow-sm flex items-center justify-between hover:bg-red-100 transition-colors mb-2">
           <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl text-red-600"><Trash size={20}/></div>
              <span className="font-medium text-red-600">{t('prof.delete')}</span>
           </div>
        </button>

        <button onClick={handleDeleteAccount} className="w-full bg-red-100 p-4 rounded-2xl shadow-sm flex items-center justify-between hover:bg-red-200 transition-colors">
           <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl text-red-800"><AlertTriangle size={20}/></div>
              <span className="font-medium text-red-800">{t('prof.deleteAcc')}</span>
           </div>
        </button>
      </div>

      <div className="text-center pb-4">
        <p className="text-[10px] text-gray-300">v{APP_VERSION} • Local Storage Only</p>
      </div>
    </div>
  );
};

export default Profile;
