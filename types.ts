
export type CategoryId = 'exercise' | 'health' | 'study' | 'work';

export type MeasureType = 'time' | 'number' | 'text';

export interface SubCategory {
  id: string;
  categoryId: CategoryId;
  name: string;
  isCustom: boolean;
  measureType: MeasureType; 
  unit?: string; 
}

export interface Category {
  id: CategoryId;
  name: string;
  color: string;
  iconName: string;
  tips: string[];
}

export type MoodType = 'happy' | 'neutral' | 'sad' | 'stressed' | 'excited';

export interface DailyMood {
  date: string; 
  mood: MoodType;
}

export interface RecordMedia {
  type: 'image' | 'audio';
  data: string; 
  timestamp: number;
}

export interface ActivityRecord {
  id: string;
  date: string; 
  subCategoryId: string;
  categoryId: CategoryId;
  durationMinutes: number; 
  metricValue?: number;    
  metricUnit?: string;
  note: string;
  media: RecordMedia[];
  timestamp: number;
}

export interface Plan {
  id: string;
  date: string; 
  subCategoryId: string;
  categoryId: CategoryId;
  targetDurationMinutes?: number;
  completedRecordId?: string; 
}

export interface RecurringPlan {
  id: string;
  subCategoryId: string;
  categoryId: CategoryId;
  daysOfWeek: number[]; 
  targetDurationMinutes: number;
  startDate: string; // New field: When was this plan created?
}

export interface UserProfile {
  id?: string; // Added ID for multi-user support
  name: string;
  avatar: string;
  pin?: string; 
  language: 'en' | 'zh';
}

export interface UserSummary {
  id: string;
  name: string;
  avatar: string;
  hasPin: boolean;
}

export interface AppData {
  version?: number; // Added for migration tracking
  subCategories: SubCategory[];
  records: ActivityRecord[];
  plans: Plan[];
  recurringPlans: RecurringPlan[];
  moods: DailyMood[];
  user: UserProfile;
}