export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroups: string[];
}

export interface WorkoutSet {
  id: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
}

export interface Workout {
  id: string;
  date: string;
  sets: WorkoutSet[];
  duration: number;
  notes: string;
  userId: string;
}

export interface BodyWeightEntry {
  id: string;
  weight: number;
  date: string;
}

export interface NutritionEntry {
  id: string;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes: string;
  meals: Meal[];
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
}

export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface UserFood {
  id: string; // Firestore doc id
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  description?: string;
  creatorUid?: string;
  servingSize: number; // grams for which macros are specified
}