
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MOODS } from '../constants';
import { ChevronLeft, ChevronRight, Trash2, Check, XCircle, Clock, Trophy, Star } from 'lucide-react';

const CalendarView: React.FC = () => {
  const { setMood, getPlansForDate, records, subCategories, deleteRecord, moods, t, user } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
  };

  // Get data for selected date
  const daysMood = moods.find(m => m.date === selectedDate);
  const daysRecords = records.filter(r => r.date === selectedDate);
  // Use the helper to get all plans (one-off AND recurring) for this date
  const daysAllPlans = getPlansForDate(selectedDate);
  
  const isFuture = selectedDate > todayStr;

  // Helpers for calendar grid
  const getDayContent = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const dayRecords = records.filter(r => r.date === dateStr);
    const hasRecord = dayRecords.length > 0;
    
    // Check specific achievements
    const hasWin = dayRecords.some(r => r.subCategoryId === 'wk-win');
    const hasBreakthrough = dayRecords.some(r => r.subCategoryId === 'wk-break');

    // Check if any plan exists for this date (recurring or one-off)
    const plansForDay = getPlansForDate(dateStr);
    const hasPlan = plansForDay.length > 0;
    
    const isSelected = dateStr === selectedDate;

    return (
      <button
        onClick={() => handleDateClick(day)}
        className={`h-10 w-10 rounded-full flex items-center justify-center relative text-sm transition-all
          ${isSelected ? 'bg-primary text-white font-bold shadow-md scale-110 z-10' : 'text-gray-700'}
          ${!isSelected && hasRecord ? 'bg-green-100 text-green-700' : ''}
          ${!isSelected && !hasRecord && hasPlan ? 'bg-gray-50' : ''}
        `}
      >
        {day}
        
        {/* Indicators */}
        <div className="absolute -bottom-1 flex gap-0.5 justify-center">
          {hasBreakthrough && (
             <Trophy size={8} className="text-yellow-500 fill-yellow-500" />
          )}
          {hasWin && !hasBreakthrough && (
             <Star size={8} className="text-orange-400 fill-orange-400" />
          )}
          {hasPlan && !hasRecord && !isSelected && !hasWin && !hasBreakthrough && (
             <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          )}
        </div>
      </button>
    );
  };

  const getSubCategoryName = (id: string) => {
    const sub = subCategories.find(s => s.id === id);
    if (!sub) return 'Unknown';
    // Attempt translation
    return t(`sub.${sub.id}`) === `sub.${sub.id}` ? sub.name : t(`sub.${sub.id}`);
  };

  const weekDays = user.language === 'zh' 
    ? ['日','一','二','三','四','五','六']
    : ['Su','Mo','Tu','We','Th','Fr','Sa'];

  return (
    <div className="pb-24 h-full flex flex-col">
      {/* Calendar Header */}
      <div className="bg-white p-4 rounded-b-3xl shadow-sm z-10">
        <div className="flex justify-between items-center mb-4">
          <button onClick={prevMonth} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><ChevronLeft size={20} /></button>
          <h2 className="text-lg font-bold">
            {currentDate.toLocaleString(user.language === 'zh' ? 'zh-CN' : 'en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={nextMonth} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><ChevronRight size={20} /></button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {weekDays.map(d => (
            <div key={d} className="text-xs text-gray-400 font-medium">{d}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1 justify-items-center">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => (
             <div key={`day-${i + 1}`}>{getDayContent(i + 1)}</div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex justify-center gap-4 text-[10px] text-gray-400">
           <div className="flex items-center gap-1"><Trophy size={10} className="text-yellow-500" /> {t('sub.wk-break')}</div>
           <div className="flex items-center gap-1"><Star size={10} className="text-orange-400" /> {t('sub.wk-win')}</div>
        </div>
      </div>

      {/* Selected Date Details */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <h3 className="text-gray-500 font-medium border-b pb-2 flex justify-between items-center">
          <span>{t('cal.details')} {selectedDate}</span>
          {selectedDate === todayStr && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Today</span>}
        </h3>

        {/* Mood Selector */}
        <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">{t('cal.feel')}</p>
            {isFuture ? (
               <div className="bg-gray-50 p-3 rounded-2xl border border-dashed border-gray-300 text-center text-xs text-gray-400">
                 {t('cal.future')}
               </div>
            ) : (
                <div className="flex justify-between bg-white p-3 rounded-2xl shadow-sm">
                  {MOODS.map((m) => (
                    <button
                      key={m.type}
                      onClick={() => setMood(selectedDate, m.type)}
                      className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all ${daysMood?.mood === m.type ? 'bg-gray-100 ring-2 ring-primary scale-110' : 'opacity-60'}`}
                    >
                      <m.icon className={m.color} size={24} />
                    </button>
                  ))}
                </div>
            )}
        </div>

        {/* Records List */}
        <div className="space-y-3">
           <p className="text-sm font-semibold text-gray-700">{t('cal.log')}</p>
           {daysRecords.length === 0 && <p className="text-sm text-gray-400 italic">{t('cal.noLog')}</p>}
           {daysRecords.map(record => {
             const sub = subCategories.find(s => s.id === record.subCategoryId);
             let displayValue = `${record.durationMinutes} min`;
             if (sub?.measureType === 'number' && record.metricValue) {
               displayValue = `${record.metricValue} ${record.metricUnit || ''}`;
             } else if (sub?.measureType === 'text') {
               displayValue = 'Logged';
             }
             
             // Special styling for achievements
             const isSpecial = record.subCategoryId === 'wk-win' || record.subCategoryId === 'wk-break';

             return (
              <div key={record.id} className={`p-4 rounded-2xl shadow-sm relative group ${isSpecial ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-100' : 'bg-white'}`}>
                <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        {record.subCategoryId === 'wk-break' && <Trophy size={16} className="text-yellow-600"/>}
                        {record.subCategoryId === 'wk-win' && <Star size={16} className="text-orange-500"/>}
                        <h4 className={`font-bold ${isSpecial ? 'text-orange-800' : 'text-gray-800'}`}>{getSubCategoryName(record.subCategoryId)}</h4>
                      </div>
                      <p className="text-xs text-gray-500 font-bold mt-0.5">{displayValue}</p>
                      {record.note && <p className="mt-2 text-sm text-gray-600 bg-white/50 p-2 rounded-lg italic">"{record.note}"</p>}
                      {/* Media Indicators */}
                      <div className="flex gap-2 mt-2">
                          {record.media.some(m => m.type === 'image') && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">📷 {t('cal.img')}</span>}
                          {record.media.some(m => m.type === 'audio') && <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">🎤 {t('cal.audio')}</span>}
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteRecord(record.id)}
                      className="text-gray-300 hover:text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                </div>
              </div>
             );
           })}
        </div>

        {/* Plans List */}
        <div className="space-y-3">
           <p className="text-sm font-semibold text-gray-700">{t('cal.plan')}</p>
           {daysAllPlans.length === 0 && <p className="text-sm text-gray-400 italic">{t('cal.noPlan')}</p>}
           {daysAllPlans.map((item, idx) => {
             const { plan, isCompleted, isRecurring } = item;
             // Logic: If it's done, it's done. 
             // If not done AND it's in the past AND it's NOT a recurring plan (unless we want to shame users for missing recurring plans too)
             // Update: User requested "Recurring plans shouldn't affect previous dates arrangements". 
             // We solved this via getPlansForDate filtering by startDate.
             // However, for visualization: if a recurring plan exists for that date (it passed the filter) but wasn't done, 
             // do we show it as missed? Yes, because if it passed the filter, it was a valid plan for that day.
             
             const isMissed = !isCompleted && selectedDate < todayStr;
             const target = (plan as any).targetDurationMinutes || 0;

             return (
              <div key={idx} className={`p-4 rounded-2xl border-l-4 shadow-sm flex justify-between items-center 
                ${isCompleted ? 'bg-green-50 border-green-500' : isMissed ? 'bg-red-50 border-red-500' : 'bg-white border-gray-300'}
              `}>
                 <div>
                    <h4 className={`font-medium ${isCompleted ? 'line-through text-green-900 opacity-70' : isMissed ? 'text-red-900' : 'text-gray-800'}`}>
                      {getSubCategoryName(plan.subCategoryId)}
                    </h4>
                    <div className="flex gap-2 mt-1">
                      {isRecurring && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">{t('entry.recurring')}</span>}
                      {target > 0 && (
                        <p className={`text-xs ${isCompleted || isMissed ? 'opacity-70 text-gray-600' : 'text-gray-500'}`}>
                          {t('cal.target')}: {target} min
                        </p>
                      )}
                    </div>
                 </div>
                 <div className="text-sm font-bold">
                   {isCompleted ? (
                     <span className="text-green-600 flex items-center gap-1"><Check size={16}/> {t('cal.done')}</span>
                   ) : isMissed ? (
                     <span className="text-red-600 flex items-center gap-1"><XCircle size={16}/> {t('cal.missed')}</span>
                   ) : (
                     <span className="text-gray-400 flex items-center gap-1"><Clock size={16}/> {t('cal.pending')}</span>
                   )}
                 </div>
              </div>
             )
           })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
