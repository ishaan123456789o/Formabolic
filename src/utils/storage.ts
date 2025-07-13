import { Workout, BodyWeightEntry, NutritionEntry, NutritionGoals } from '../types';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth } from '../config/firebase';

const db = getFirestore();

const STORAGE_KEYS = {
  WORKOUTS: 'gym-assistant-workouts',
  BODY_WEIGHT: 'gym-assistant-body-weight',
  NUTRITION: 'gym-assistant-nutrition',
  NUTRITION_GOALS: 'gym-assistant-nutrition-goals'
};

// Generic function to save user-specific data
export const saveUserData = async (collectionName: string, data: any) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user logged in');
  }

  try {
    const userDocRef = doc(db, 'users', user.uid, collectionName, 'data');
    await setDoc(userDocRef, data);
  } catch (error) {
    console.error('Error saving data:', error);
    throw error;
  }
};

// Generic function to get user-specific data
export const getUserData = async (collectionName: string) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user logged in');
  }

  try {
    const userDocRef = doc(db, 'users', user.uid, collectionName, 'data');
    const docSnap = await getDoc(userDocRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error('Error getting data:', error);
    throw error;
  }
};

// Function to save workout data
export const saveWorkoutData = async (workoutData: any) => {
  return saveUserData('workouts', workoutData);
};

// Function to get workout data
export const getWorkoutData = async () => {
  return getUserData('workouts');
};

// Function to save nutrition data
export const saveNutritionData = async (nutritionData: any) => {
  return saveUserData('nutrition', nutritionData);
};

// Function to get nutrition data
export const getNutritionData = async () => {
  return getUserData('nutrition');
};

// Function to save progress data
export const saveProgressData = async (progressData: any) => {
  return saveUserData('progress', progressData);
};

// Function to get progress data
export const getProgressData = async () => {
  return getUserData('progress');
};

// Function to save form check videos
export const saveFormCheckData = async (formCheckData: any) => {
  return saveUserData('formCheck', formCheckData);
};

// Function to get form check videos
export const getFormCheckData = async () => {
  return getUserData('formCheck');
};

// Function to save workout history
export const saveWorkoutHistory = async (historyData: any) => {
  return saveUserData('workoutHistory', historyData);
};

// Function to get workout history
export const getWorkoutHistory = async () => {
  return getUserData('workoutHistory');
};

// Workout Storage
export const saveWorkout = (workout: Workout) => {
  const workouts = getWorkouts();
  const updatedWorkouts = [...workouts, workout];
  localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(updatedWorkouts));
};

export const getWorkouts = (): Workout[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.WORKOUTS);
  return stored ? JSON.parse(stored) : [];
};

export const deleteWorkout = (workoutId: string) => {
  const workouts = getWorkouts();
  const updatedWorkouts = workouts.filter(workout => workout.id !== workoutId);
  localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(updatedWorkouts));
};

// Save a body weight entry for the current user in Firestore
export const saveUserBodyWeight = async (entry: BodyWeightEntry) => {
  const user = auth.currentUser;
  if (!user) {
    // fallback to localStorage for guests
    const entries = getBodyWeightEntries();
    const updatedEntries = [...entries, entry].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    localStorage.setItem(STORAGE_KEYS.BODY_WEIGHT, JSON.stringify(updatedEntries));
    return;
  }
  const db = getFirestore();
  const docRef = doc(db, 'users', user.uid, 'bodyWeight', entry.id);
  await setDoc(docRef, entry);
};

// Get all body weight entries for the current user from Firestore
export const getUserBodyWeightEntries = async (): Promise<BodyWeightEntry[]> => {
  const user = auth.currentUser;
  if (!user) {
    // fallback to localStorage for guests
    return getBodyWeightEntries();
  }
  const db = getFirestore();
  const colRef = collection(db, 'users', user.uid, 'bodyWeight');
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(doc => doc.data() as BodyWeightEntry).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// Deprecated: use saveUserBodyWeight and getUserBodyWeightEntries for user-specific data
export const saveBodyWeight = (entry: BodyWeightEntry) => {
  saveUserBodyWeight(entry);
};

export const getBodyWeightEntries = (): BodyWeightEntry[] => {
  // This is only used for guests; for logged-in users, use getUserBodyWeightEntries
  const stored = localStorage.getItem(STORAGE_KEYS.BODY_WEIGHT);
  return stored ? JSON.parse(stored) : [];
};

// Nutrition Storage
export const saveNutritionEntry = (entry: NutritionEntry) => {
  const entries = getNutritionEntries();
  const existingIndex = entries.findIndex(e => e.date === entry.date);
  
  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }
  
  localStorage.setItem(STORAGE_KEYS.NUTRITION, JSON.stringify(entries));
};

export const getNutritionEntries = (): NutritionEntry[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.NUTRITION);
  return stored ? JSON.parse(stored) : [];
};

export const saveNutritionGoals = (goals: NutritionGoals) => {
  localStorage.setItem(STORAGE_KEYS.NUTRITION_GOALS, JSON.stringify(goals));
};

export const getNutritionGoals = (): NutritionGoals => {
  const stored = localStorage.getItem(STORAGE_KEYS.NUTRITION_GOALS);
  return stored ? JSON.parse(stored) : {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65
  };
};

// Utility functions
export const getExerciseProgress = (exerciseId: string): { weight: number; reps: number; date: string }[] => {
  const workouts = getWorkouts();
  const exerciseSets = workouts
    .flatMap(workout => workout.sets)
    .filter(set => set.exerciseId === exerciseId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  return exerciseSets.map(set => ({
    weight: set.weight,
    reps: set.reps,
    date: set.date
  }));
};