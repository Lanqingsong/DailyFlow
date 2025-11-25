
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../constants';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Legend, LineChart, Line
} from 'recharts';
import { Clock, BarChart2, PieChart as PieChartIcon, Target, TrendingUp, CheckCircle2, Circle, ArrowRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { records, getPlansForDate, user, subCategories, addRecord, t } = useApp();
  const navigate = useNavigate();
  const [focusType, setFocusType] = useState<'category' | 'activity'>('category');
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const today = new Date().toISOString().split('T')[0];

  const todaysPlans = getPlansForDate(today);

  // --- Metrics State ---
  const [selectedMetricId, setSelectedMetricId] = useState<string>('');

  const numericSubCategories = useMemo(() => 
    subCategories.filter(s => s.measureType === 'number'), 
  [subCategories]);

  // Set default metric to Weight or first available
  useEffect(() => {
    if (numericSubCategories.length > 0 && !selectedMetricId) {
      const weightOption = numericSubCategories.find(s => s.name.toLowerCase().includes('weight'));
      setSelectedMetricId(weightOption ? weightOption.id : numericSubCategories[0].id);
    }
  }, [numericSubCategories, selectedMetricId]);

  const COLORS = {
    exercise: '#3b82f6', // blue-500
    health: '#22c55e',   // green-500
    study: '#a855f7',    // purple-500
    work: '#f97316',     // orange-500
  };

  const getCatName = (id: string) => t(`cat.${id}`) || id;

  // Quick Complete Logic
  const handleQuickComplete = (subCategoryId: string, categoryId: any, targetDuration: number = 30) => {
    if (confirm(`${t('dash.markDone')} ${targetDuration} mins?`)) {
      addRecord({
        date: today,
        categoryId: categoryId,
        subCategoryId: subCategoryId,
        durationMinutes: targetDuration,
        note: t('dash.quickCheck'),
        media: []
      });
    }
  };

  const getSubName = (id: string) => {
    const sub = subCategories.find(s => s.id === id);
    if (!sub) return 'Activity';
    // Try to translate if it matches known keys, else use custom name
    return t(`sub.${sub.id}`) === `sub.${sub.id}` ? sub.name : t(`sub.${sub.id}`);
  };

  // --- 1. Weekly Stacked Bar Chart (Time Based Only) ---
  const weeklyData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString(user.language === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'short' });
      
      const dayRecords = records.filter(r => r.date === dateStr && r.durationMinutes > 0);
      
      const dayStats: any = {
        name: dayLabel,
        total: 0,
        exercise: 0,
        health: 0,
        study: 0,
        work: 0,
      };

      dayRecords.forEach(r => {
        if (dayStats[r.categoryId] !== undefined) {
          dayStats[r.categoryId] += r.durationMinutes;
          dayStats.total += r.durationMinutes;
        }
      });

      data.push(dayStats);
    }
    return data;
  }, [records, user.language]);

  // --- 2. Focus Analysis Data (Time Based Only) ---
  const filteredRecords = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setHours(0,0,0,0);

    if (timeRange === 'week') {
      cutoff.setDate(now.getDate() - 7);
    } else {
      cutoff.setDate(now.getDate() - 30);
    }
    
    return records.filter(r => new Date(r.date) >= cutoff && r.durationMinutes > 0);
  }, [records, timeRange]);

  const totalFilteredMinutes = filteredRecords.reduce((acc, r) => acc + r.durationMinutes, 0);

  const categoryPieData = useMemo(() => {
    return CATEGORIES.map(cat => {
      const total = filteredRecords
        .filter(r => r.categoryId === cat.id)
        .reduce((acc, cur) => acc + cur.durationMinutes, 0);
      return { 
        name: getCatName(cat.id), 
        value: total, 
        color: COLORS[cat.id as keyof typeof COLORS],
        percentage: totalFilteredMinutes ? Math.round((total / totalFilteredMinutes) * 100) : 0
      };
    }).filter(d => d.value > 0);
  }, [filteredRecords, totalFilteredMinutes, user.language]); // Depend on language

  const activityStats = useMemo(() => {
    const map = new Map<string, { name: string; value: number; color: string; categoryName: string }>();
    
    filteredRecords.forEach(r => {
      const sub = subCategories.find(s => s.id === r.subCategoryId);
      const cat = CATEGORIES.find(c => c.id === r.categoryId);
      const name = getSubName(r.subCategoryId);
      
      const current = map.get(r.subCategoryId) || { 
        name, 
        value: 0, 
        color: COLORS[r.categoryId as keyof typeof COLORS] || '#ccc',
        categoryName: cat ? getCatName(cat.id) : ''
      };
      
      map.set(r.subCategoryId, {
        ...current,
        value: current.value + r.durationMinutes
      });
    });

    return Array.from(map.values()).sort((a, b) => b.value - a.value);
  }, [filteredRecords, subCategories, user.language]);

  // --- 3. Metrics Data (Weight etc.) ---
  const metricData = useMemo(() => {
    if (!selectedMetricId) return [];
    
    const targetRecords = records
      .filter(r => r.subCategoryId === selectedMetricId && r.metricValue !== undefined)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const map = new Map<string, number>();
    targetRecords.forEach(r => {
      if (r.metricValue !== undefined) {
        map.set(r.date, r.metricValue);
      }
    });

    return Array.from(map.entries()).map(([date, value]) => ({
      date: new Date(date).toLocaleDateString(user.language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' }),
      fullDate: date,
      value
    })).slice(-14);
  }, [records, selectedMetricId, user.language]);

  const selectedMetricUnit = subCategories.find(s => s.id === selectedMetricId)?.unit || '';

  const todayDuration = records
    .filter(r => r.date === today)
    .reduce((acc, cur) => acc + cur.durationMinutes, 0);

  // Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl text-xs">
          <p className="font-bold text-gray-700 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => {
            if (entry.value === 0) return null;
            return (
              <div key={index} className="flex items-center justify-between gap-4 mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.stroke }} />
                  <span className="text-gray-500 capitalize">{entry.name}</span>
                </div>
                <span className="font-bold text-gray-800">{entry.value} {entry.unit}</span>
              </div>
            );
          })}
          {!payload[0].unit && (
            <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between gap-4">
                <span className="font-bold text-gray-600">Total</span>
                <span className="font-bold text-primary">{total}m</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-b-3xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('dash.welcome')}, {user.name.split(' ')[0]}!</h1>
          <p className="text-gray-500 text-sm mt-1">{t('dash.subtitle')}</p>
        </div>
        <img src={user.avatar} alt="Avatar" className="w-14 h-14 rounded-full border-2 border-white shadow-md" />
      </div>

      {/* Today's Goals & Timer */}
      <div className="px-6 grid grid-cols-1 gap-4">
         {/* Today's Stats Small Card */}
         <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-3xl p-5 text-white shadow-lg flex items-center justify-between">
            <div>
               <div className="flex items-center gap-2 mb-1 opacity-70">
                 <Clock size={16} />
                 <span className="text-xs font-bold uppercase tracking-wider">{t('dash.activeTime')}</span>
               </div>
               <div className="text-2xl font-bold">{Math.floor(todayDuration / 60)}h {todayDuration % 60}m</div>
            </div>
            <button onClick={() => navigate('/add')} className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors">
               <ArrowRight size={20} />
            </button>
         </div>

         {/* Interactive Checklist */}
         <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
               <span className="text-sm font-bold text-gray-800 flex items-center gap-2">
                 <Target size={18} className="text-primary"/> {t('dash.plan')}
               </span>
               <span className="text-xs font-bold text-gray-400">{todaysPlans.filter(p => p.isCompleted).length}/{todaysPlans.length} {t('dash.done')}</span>
            </div>
            
            <div className="space-y-3">
               {todaysPlans.length === 0 && <p className="text-sm text-gray-400 italic text-center py-2">{t('dash.noPlans')}</p>}
               {todaysPlans.map((item, idx) => {
                  const { plan, isCompleted, isRecurring, currentDuration } = item;
                  const target = (plan as any).targetDurationMinutes || 0;
                  const progress = Math.min(100, target > 0 ? (currentDuration || 0) / target * 100 : 0);

                  return (
                    <div key={idx} className={`p-3 rounded-xl transition-all ${isCompleted ? 'bg-green-50' : 'bg-gray-50'}`}>
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <button 
                                disabled={isCompleted}
                                onClick={() => handleQuickComplete(plan.subCategoryId, plan.categoryId, target)}
                                className={`transition-colors ${isCompleted ? 'text-green-500 cursor-default' : 'text-gray-300 hover:text-green-500'}`}
                              >
                                {isCompleted ? <CheckCircle2 size={24} fill="#dcfce7" /> : <Circle size={24} />}
                              </button>
                              <div>
                                <p className={`font-bold text-sm ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                    {getSubName(plan.subCategoryId)}
                                </p>
                                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                  {isRecurring && <span className="bg-blue-100 text-blue-600 px-1 rounded-[2px]">{t('entry.recurring')}</span>}
                                  {target > 0 ? `${currentDuration}/${target} mins` : 'Task'}
                                </p>
                              </div>
                          </div>
                       </div>
                       {/* Progress Bar for Time-based Plans */}
                       {target > 0 && !isCompleted && (
                         <div className="mt-2 w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-primary h-full rounded-full transition-all duration-500" style={{width: `${progress}%`}}></div>
                         </div>
                       )}
                    </div>
                  );
               })}
            </div>
         </div>
      </div>

      {/* NEW: Personal Metrics Chart */}
      {numericSubCategories.length > 0 && (
        <div className="px-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="bg-green-50 p-2 rounded-lg text-green-600">
                    <Activity size={20} />
                  </div>
                  <h2 className="text-lg font-bold text-gray-800">{t('dash.metrics')}</h2>
                </div>
                {numericSubCategories.length > 1 && (
                  <select 
                    value={selectedMetricId} 
                    onChange={(e) => setSelectedMetricId(e.target.value)}
                    className="bg-gray-50 border-none text-xs font-bold text-gray-600 rounded-lg py-1 px-2 outline-none"
                  >
                    {numericSubCategories.map(sub => (
                      <option key={sub.id} value={sub.id}>{getSubName(sub.id)}</option>
                    ))}
                  </select>
                )}
             </div>

             <div className="h-48 w-full">
                {metricData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metricData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} dy={10} />
                      <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                      <Tooltip content={<CustomTooltip />} cursor={{stroke: '#e5e7eb', strokeWidth: 2}} />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#10b981" 
                        strokeWidth={3} 
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4, stroke: '#fff' }} 
                        activeDot={{ r: 6 }} 
                        unit={selectedMetricUnit}
                        name={getSubName(selectedMetricId)}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <Activity size={32} className="mb-2 opacity-30" />
                    <span className="text-sm">{t('dash.noData')}</span>
                    <button 
                       onClick={() => {
                          navigate('/add'); 
                       }} 
                       className="mt-2 text-xs text-primary font-bold hover:underline"
                    >
                      {t('dash.addEntry')}
                    </button>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Chart 1: Weekly Breakdown */}
      <div className="px-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="bg-blue-50 p-2 rounded-lg text-blue-500">
                <TrendingUp size={20} />
              </div>
              <h2 className="text-lg font-bold text-gray-800">{t('dash.weekly')}</h2>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f9fafb'}} />
                <Bar dataKey="exercise" stackId="a" fill={COLORS.exercise} radius={[0,0,0,0]} barSize={12} />
                <Bar dataKey="health" stackId="a" fill={COLORS.health} radius={[0,0,0,0]} barSize={12} />
                <Bar dataKey="study" stackId="a" fill={COLORS.study} radius={[0,0,0,0]} barSize={12} />
                <Bar dataKey="work" stackId="a" fill={COLORS.work} radius={[4,4,0,0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 2: Focus Analysis */}
      <div className="px-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-purple-50 p-2 rounded-lg text-purple-500">
                  <PieChartIcon size={20} />
                </div>
                <h2 className="text-lg font-bold text-gray-800">{t('dash.focus')}</h2>
              </div>
              
              <div className="bg-gray-100 p-1 rounded-lg flex">
                 <button onClick={() => setFocusType('category')} className={`p-1.5 rounded-md transition-all ${focusType === 'category' ? 'bg-white shadow text-primary' : 'text-gray-400'}`}>
                   <PieChartIcon size={16} />
                 </button>
                 <button onClick={() => setFocusType('activity')} className={`p-1.5 rounded-md transition-all ${focusType === 'activity' ? 'bg-white shadow text-primary' : 'text-gray-400'}`}>
                   <BarChart2 size={16} />
                 </button>
              </div>
            </div>

            <div className="flex bg-gray-50 p-1 rounded-xl">
               <button onClick={() => setTimeRange('week')} className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${timeRange === 'week' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}>{t('dash.week')}</button>
               <button onClick={() => setTimeRange('month')} className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${timeRange === 'month' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}>{t('dash.month')}</button>
            </div>
          </div>

          <div className="h-64 w-full mb-6">
            {focusType === 'category' ? (
              categoryPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {categoryPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{fontSize: '12px'}} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-300">
                  <PieChartIcon size={48} className="mb-2 opacity-20" />
                  <span className="text-sm">{t('dash.noTime')}</span>
                </div>
              )
            ) : (
              activityStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={activityStats.slice(0, 8)} margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#4b5563', fontWeight: 600}} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px'}} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                      {activityStats.slice(0, 8).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-300">
                   <BarChart2 size={48} className="mb-2 opacity-20" />
                   <span className="text-sm">{t('dash.noAct')}</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
