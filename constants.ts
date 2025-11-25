
import { Category, SubCategory, MoodType } from './types';
import { 
  Dumbbell, 
  Salad, 
  BookOpen, 
  Briefcase, 
  Smile, 
  Meh, 
  Frown, 
  Zap, 
  CloudRain 
} from 'lucide-react';

// --- VERSION CONTROL ---
// Update this string to change the version displayed in the Profile page
export const APP_VERSION = '1.3.0'; 

export const CATEGORIES: Category[] = [
  { 
    id: 'exercise', 
    name: 'Exercise', 
    color: 'bg-blue-500', 
    iconName: 'Dumbbell',
    tips: ['Consistency is key!', 'Don\'t forget to stretch.', 'Stay hydrated during workouts.']
  },
  { 
    id: 'health', 
    name: 'Health', 
    color: 'bg-green-500', 
    iconName: 'Salad',
    tips: ['Eat more greens today.', 'Limit sugar intake.', 'Water is your best friend.', 'Track your weight weekly.']
  },
  { 
    id: 'study', 
    name: 'Learning', 
    color: 'bg-purple-500', 
    iconName: 'BookOpen',
    tips: ['Review yesterday\'s notes.', 'Focus for 25 mins, break for 5.', 'Practice makes perfect.']
  },
  { 
    id: 'work', 
    name: 'Work', 
    color: 'bg-orange-500', 
    iconName: 'Briefcase',
    tips: ['Clear your inbox.', 'Prioritize the hardest task.', 'Celebrate small wins.']
  },
];

export const DEFAULT_SUBCATEGORIES: SubCategory[] = [
  // Exercise
  { id: 'ex-run', categoryId: 'exercise', name: 'Running', isCustom: false, measureType: 'time' },
  { id: 'ex-gym', categoryId: 'exercise', name: 'Gym', isCustom: false, measureType: 'time' },
  
  // Health (Diet, Weight)
  { id: 'h-veg', categoryId: 'health', name: 'Vegetarian Meal', isCustom: false, measureType: 'text' },
  { id: 'h-water', categoryId: 'health', name: 'Drink Water', isCustom: false, measureType: 'text' },
  { id: 'h-weight', categoryId: 'health', name: 'Body Weight', isCustom: false, measureType: 'number', unit: 'kg' },
  { id: 'h-meal', categoryId: 'health', name: 'Meal Log', isCustom: false, measureType: 'text' },
  
  // Study
  { id: 'st-read', categoryId: 'study', name: 'Reading', isCustom: false, measureType: 'time' },
  { id: 'st-cpp', categoryId: 'study', name: 'C++ Practice', isCustom: false, measureType: 'time' },
  { id: 'st-lc', categoryId: 'study', name: 'LeetCode', isCustom: false, measureType: 'time' },
  
  // Work (Achievements)
  { id: 'wk-meet', categoryId: 'work', name: 'Meetings', isCustom: false, measureType: 'time' },
  { id: 'wk-deep', categoryId: 'work', name: 'Deep Work', isCustom: false, measureType: 'time' },
  { id: 'wk-win', categoryId: 'work', name: 'Achievement', isCustom: false, measureType: 'text' },
  { id: 'wk-break', categoryId: 'work', name: 'Breakthrough', isCustom: false, measureType: 'text' },
];

export const MOODS: { type: MoodType; icon: any; color: string; label: string }[] = [
  { type: 'happy', icon: Smile, color: 'text-green-500', label: 'Happy' },
  { type: 'excited', icon: Zap, color: 'text-yellow-500', label: 'Excited' },
  { type: 'neutral', icon: Meh, color: 'text-gray-400', label: 'Neutral' },
  { type: 'stressed', icon: CloudRain, color: 'text-purple-500', label: 'Stressed' },
  { type: 'sad', icon: Frown, color: 'text-blue-500', label: 'Sad' },
];

export const STORAGE_KEY = 'dailyflow_app_v3';
