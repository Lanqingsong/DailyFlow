
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppData, SubCategory, ActivityRecord, Plan, RecurringPlan, DailyMood, CategoryId, UserProfile, UserSummary } from '../types';
import { DEFAULT_SUBCATEGORIES, STORAGE_KEY } from '../constants';
import { translations, Language } from '../translations';

// Registry Key for list of users
const REGISTRY_KEY = 'dailyflow_users_registry';
const LAST_USER_KEY = 'dailyflow_last_user_id';

// Current Data Schema Version
// Increment this number whenever you change the data structure (e.g. add new fields)
const CURRENT_DATA_VERSION = 2;

interface AppContextType extends AppData {
  isAuthenticated: boolean;
  currentLanguage: Language;
  usersRegistry: UserSummary[];
  t: (key: string) => string;
  setLanguage: (lang: Language) => void;
  createAccount: (name: string, lang: Language, pin?: string) => void;
  switchAccount: (userId: string | null) => void; // null means go to selection screen
  login: (pin: string) => boolean;
  logout: () => void; // Lock current account
  deleteAccount: (userId: string) => void; // NEW: Delete account
  updateUser: (updates: Partial<UserProfile>) => void;
  addSubCategory: (categoryId: CategoryId, name: string) => void;
  addRecord: (record: Omit<ActivityRecord, 'id' | 'timestamp'>) => void;
  deleteRecord: (id: string) => void;
  addPlan: (plan: Omit<Plan, 'id'>) => void;
  addRecurringPlan: (plan: Omit<RecurringPlan, 'id' | 'startDate'>) => void;
  deleteRecurringPlan: (id: string) => void;
  cancelPlan: (planId: string) => void;
  setMood: (date: string, mood: DailyMood['mood']) => void;
  importData: (jsonData: string) => boolean;
  exportData: () => string;
  resetData: () => void;
  getPlansForDate: (date: string) => { plan: Plan | RecurringPlan; isRecurring: boolean; isCompleted: boolean; completedByRecordId?: string; currentDuration?: number }[];
  setIsPickingFile: (isPicking: boolean) => void; // NEW: Prevent lock during file pick
  lastActiveUserId: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_USER: UserProfile = {
  id: 'default',
  name: 'User',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  language: 'zh'
};

const INITIAL_DATA: AppData = {
  version: CURRENT_DATA_VERSION,
  subCategories: DEFAULT_SUBCATEGORIES,
  records: [],
  plans: [],
  recurringPlans: [],
  moods: [],
  user: DEFAULT_USER,
};

// --- Migration Logic ---
const migrateData = (data: any): AppData => {
  let migrated = { ...data };

  // If no version, assume version 0 (Initial Release)
  const version = migrated.version || 0;

  if (version < 1) {
     // Migration v0 -> v1: Ensure recurringPlans exists
     if (!migrated.recurringPlans) {
       migrated.recurringPlans = [];
     }
  }

  if (version < 2) {
    // Migration v1 -> v2: Ensure User ID exists and is string
    if (migrated.user && !migrated.user.id) {
       migrated.user.id = `user-${Date.now()}`;
    }
    // Ensure all records have valid timestamp
    migrated.records = migrated.records.map((r: any) => ({
       ...r,
       timestamp: r.timestamp || Date.now()
    }));
  }

  // Update version to current
  migrated.version = CURRENT_DATA_VERSION;
  return migrated as AppData;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Global Registry State
  const [usersRegistry, setUsersRegistry] = useState<UserSummary[]>([]);
  
  // Current User Data State
  const [state, setState] = useState<AppData>(INITIAL_DATA);
  
  // Auth & Session State
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [lastActiveUserId, setLastActiveUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // Flag to prevent auto-lock when picking files/camera
  const [isPickingFile, setIsPickingFile] = useState(false);

  // 1. Load Registry & Last User on Mount & Handle Migration
  useEffect(() => {
    const registryJson = localStorage.getItem(REGISTRY_KEY);
    const oldDataJson = localStorage.getItem(STORAGE_KEY);
    const lastUser = localStorage.getItem(LAST_USER_KEY);

    if (lastUser) setLastActiveUserId(lastUser);

    if (registryJson) {
      setUsersRegistry(JSON.parse(registryJson));
    } else if (oldDataJson) {
      // --- LEGACY MIGRATION (Single User to Multi User) ---
      // This only runs once when updating from v1.0 to v1.2+
      try {
        const oldData = JSON.parse(oldDataJson);
        const migratedData = migrateData(oldData); // Run standard migrations
        
        const newId = migratedData.user.id || 'user-' + Date.now();
        migratedData.user.id = newId;

        // Save specific user data
        localStorage.setItem(`dailyflow_data_${newId}`, JSON.stringify(migratedData));
        
        // Create registry
        const newUserSummary: UserSummary = {
          id: newId,
          name: migratedData.user.name,
          avatar: migratedData.user.avatar,
          hasPin: !!migratedData.user.pin
        };
        const newRegistry = [newUserSummary];
        localStorage.setItem(REGISTRY_KEY, JSON.stringify(newRegistry));
        setUsersRegistry(newRegistry);
        setLastActiveUserId(newId);
        localStorage.setItem(LAST_USER_KEY, newId);
        
        // Clean old key
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.error("Migration failed", e);
      }
    }
  }, []);

  // 2. Load User Data when ID changes
  useEffect(() => {
    if (currentUserId) {
      const dataKey = `dailyflow_data_${currentUserId}`;
      const saved = localStorage.getItem(dataKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Run Migration on load to ensure data integrity
          const migrated = migrateData(parsed);
          
          // If migration changed the data, save it back immediately
          if (JSON.stringify(migrated) !== JSON.stringify(parsed)) {
             localStorage.setItem(dataKey, JSON.stringify(migrated));
          }
          
          setState(migrated);
        } catch (e) {
          console.error("Failed to load user data", e);
          setState(INITIAL_DATA);
        }
      }
      localStorage.setItem(LAST_USER_KEY, currentUserId);
      setLastActiveUserId(currentUserId);
    } else {
      setIsAuthenticated(false);
    }
  }, [currentUserId]);

  // 3. Save User Data on change
  useEffect(() => {
    if (currentUserId && state.user.id === currentUserId) {
      const dataKey = `dailyflow_data_${currentUserId}`;
      // Always save with current version
      const dataToSave = { ...state, version: CURRENT_DATA_VERSION };
      localStorage.setItem(dataKey, JSON.stringify(dataToSave));
      
      // Update Registry if basic info changed
      const summary: UserSummary = {
        id: state.user.id!,
        name: state.user.name,
        avatar: state.user.avatar,
        hasPin: !!state.user.pin
      };
      
      setUsersRegistry(prev => {
        const newReg = prev.map(u => u.id === currentUserId ? summary : u);
        const hasChanged = JSON.stringify(newReg) !== JSON.stringify(prev);
        if (hasChanged) {
           localStorage.setItem(REGISTRY_KEY, JSON.stringify(newReg));
           return newReg;
        }
        return prev;
      });
    }
  }, [state, currentUserId]);

  // Auto-lock logic
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Don't lock if we are just picking a file/image
      if (isPickingFile) return;

      if (document.hidden && state.user.pin && state.user.pin.length > 0) {
        setIsAuthenticated(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [state.user.pin, isPickingFile]);

  // Actions
  const createAccount = (name: string, lang: Language, pin?: string) => {
    const newId = `user-${Date.now()}`;
    const newUser: UserProfile = {
      id: newId,
      name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      language: lang,
      pin
    };
    
    const newData: AppData = {
      ...INITIAL_DATA,
      user: newUser
    };

    // Save Data
    localStorage.setItem(`dailyflow_data_${newId}`, JSON.stringify(newData));

    // Update Registry
    const newSummary: UserSummary = {
      id: newId,
      name,
      avatar: newUser.avatar,
      hasPin: !!pin
    };
    const newRegistry = [...usersRegistry, newSummary];
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(newRegistry));
    setUsersRegistry(newRegistry);
    
    // Log in immediately
    setCurrentUserId(newId);
    setIsAuthenticated(true);
  };

  const switchAccount = (userId: string | null) => {
    if (userId) {
      setCurrentUserId(userId);
      // Auth state will be determined by LoginScreen or Caller
    } else {
       setCurrentUserId(null);
       setIsAuthenticated(false);
       setState(INITIAL_DATA); // Clear sensitive data from memory
    }
  };

  const login = (inputPin: string) => {
    if (state.user.pin === inputPin) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    // Just lock if PIN exists, otherwise effectively switch account
    if (state.user.pin) {
      setIsAuthenticated(false);
    } else {
      switchAccount(null);
    }
  };

  const deleteAccount = (userId: string) => {
    // Remove data
    localStorage.removeItem(`dailyflow_data_${userId}`);
    
    // Remove from registry
    const newRegistry = usersRegistry.filter(u => u.id !== userId);
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(newRegistry));
    setUsersRegistry(newRegistry);

    // If deleting current user
    if (userId === currentUserId) {
       // Reset last user if it was this one
       localStorage.removeItem(LAST_USER_KEY);
       setLastActiveUserId(null);
       switchAccount(null);
    }
  };

  const updateUser = (updates: Partial<UserProfile>) => {
    setState(prev => ({
      ...prev,
      user: { ...prev.user, ...updates }
    }));
  };

  const setLanguage = (lang: Language) => {
    updateUser({ language: lang });
  };

  const t = (key: string): string => {
    const lang = state.user.language || 'zh';
    const dict = translations[lang] as Record<string, string>;
    return dict[key] || key;
  };

  // --- Data Logic ---

  const addSubCategory = (categoryId: CategoryId, name: string) => {
    const newSub: SubCategory = {
      id: `custom-${Date.now()}`,
      categoryId,
      name,
      isCustom: true,
      measureType: 'time' 
    };
    setState(prev => ({ ...prev, subCategories: [...prev.subCategories, newSub] }));
  };

  const addRecord = (record: Omit<ActivityRecord, 'id' | 'timestamp'>) => {
    const newRecord: ActivityRecord = {
      ...record,
      id: `rec-${Date.now()}`,
      timestamp: Date.now(),
    };
    
    setState(prev => {
      // Find plans to auto-complete
      const existingDuration = prev.records
        .filter(r => r.date === record.date && r.subCategoryId === record.subCategoryId)
        .reduce((sum, r) => sum + r.durationMinutes, 0);
      
      const totalDuration = existingDuration + record.durationMinutes;

      const relatedPlan = prev.plans.find(p => 
        p.date === record.date && 
        p.subCategoryId === record.subCategoryId &&
        !p.completedRecordId
      );

      let newPlans = prev.plans;
      if (relatedPlan) {
         const target = relatedPlan.targetDurationMinutes || 0;
         if (totalDuration >= target) {
           newPlans = prev.plans.map(p => 
            p.id === relatedPlan.id ? { ...p, completedRecordId: newRecord.id } : p
           );
         }
      }

      return {
        ...prev,
        records: [...prev.records, newRecord],
        plans: newPlans
      };
    });
  };

  const deleteRecord = (id: string) => {
    setState(prev => {
      return {
        ...prev,
        records: prev.records.filter(r => r.id !== id),
        plans: prev.plans.map(p => p.completedRecordId === id ? { ...p, completedRecordId: undefined } : p)
      };
    });
  };

  const addPlan = (plan: Omit<Plan, 'id'>) => {
    const newPlan: Plan = {
      ...plan,
      id: `plan-${Date.now()}`,
    };
    setState(prev => ({ ...prev, plans: [...prev.plans, newPlan] }));
  };

  const addRecurringPlan = (plan: Omit<RecurringPlan, 'id' | 'startDate'>) => {
    const newPlan: RecurringPlan = {
      ...plan,
      id: `rec-plan-${Date.now()}`,
      startDate: new Date().toISOString().split('T')[0] // Set start date to today
    };
    setState(prev => ({ ...prev, recurringPlans: [...prev.recurringPlans || [], newPlan] }));
  };

  const deleteRecurringPlan = (id: string) => {
    setState(prev => ({ ...prev, recurringPlans: prev.recurringPlans.filter(p => p.id !== id) }));
  };

  const cancelPlan = (planId: string) => {
    setState(prev => ({
      ...prev,
      plans: prev.plans.filter(p => p.id !== planId)
    }));
  };
  
  const setMood = (date: string, mood: DailyMood['mood']) => {
    setState(prev => {
      const filtered = prev.moods.filter(m => m.date !== date);
      return { ...prev, moods: [...filtered, { date, mood }] };
    });
  };

  const getPlansForDate = (date: string) => {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay(); 

    const durationMap = new Map<string, number>();
    state.records.filter(r => r.date === date).forEach(r => {
      durationMap.set(r.subCategoryId, (durationMap.get(r.subCategoryId) || 0) + r.durationMinutes);
    });

    // 1. One-off plans
    const oneOffs = state.plans.filter(p => p.date === date).map(p => {
      const current = durationMap.get(p.subCategoryId) || 0;
      const target = p.targetDurationMinutes || 0;
      const isCompleted = current >= target;

      return {
        plan: p,
        isRecurring: false,
        isCompleted: isCompleted,
        completedByRecordId: p.completedRecordId,
        currentDuration: current
      };
    });

    // 2. Recurring plans
    const recurring = (state.recurringPlans || [])
      .filter(p => {
        if (!p.startDate) return true; // Legacy support
        return date >= p.startDate;
      })
      .filter(p => p.daysOfWeek.includes(dayOfWeek))
      .map(p => {
        const current = durationMap.get(p.subCategoryId) || 0;
        const target = p.targetDurationMinutes || 0;
        const isCompleted = current >= target;

        return {
          plan: p,
          isRecurring: true,
          isCompleted: isCompleted,
          completedByRecordId: isCompleted ? 'recurring-done' : undefined,
          currentDuration: current
        };
      });

    return [...oneOffs, ...recurring];
  };

  const exportData = () => JSON.stringify(state);

  const importData = (json: string) => {
    try {
      const parsed = JSON.parse(json);
      // Run migration on imported data too
      const migrated = migrateData(parsed);
      setState(migrated);
      return true;
    } catch (e) {
      return false;
    }
  };

  const resetData = () => setState({ ...INITIAL_DATA, user: { ...state.user } }); // Keep user profile

  return (
    <AppContext.Provider value={{
      ...state,
      recurringPlans: state.recurringPlans || [],
      isAuthenticated,
      currentLanguage: state.user.language || 'zh',
      usersRegistry,
      lastActiveUserId,
      createAccount,
      switchAccount,
      t,
      setLanguage,
      login,
      logout,
      deleteAccount,
      updateUser,
      addSubCategory,
      addRecord,
      deleteRecord,
      addPlan,
      addRecurringPlan,
      deleteRecurringPlan,
      cancelPlan,
      setMood,
      importData,
      exportData,
      resetData,
      getPlansForDate,
      setIsPickingFile
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
