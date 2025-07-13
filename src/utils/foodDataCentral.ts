// Utility for searching the USDA FoodData Central API
// Paste your real API key below where indicated

import { db } from '../config/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { UserFood } from '../types';

const FDC_API_KEY = 'rz2xVxeQY2qjOhbQtVhhNLIc9vB8jrcBsvlmpkWk'; // <-- Paste your API key here
const FDC_SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';

export async function searchFoods(query: string) {
  // 1. Search user foods in Firestore
  let userFoods: UserFood[] = [];
  try {
    const foodsRef = collection(db, 'foods');
    const snapshot = await getDocs(foodsRef);
    userFoods = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as UserFood))
      .filter(food => food.name.toLowerCase().includes(query.toLowerCase()));
  } catch (e) {
    userFoods = [];
  }

  // 2. Search USDA API
  let apiFoods: any[] = [];
  try {
    const params = new URLSearchParams({
      api_key: FDC_API_KEY,
      query,
      pageSize: '10',
    });
    const url = `${FDC_SEARCH_URL}?${params.toString()}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      apiFoods = data.foods || [];
    }
  } catch (e) {
    apiFoods = [];
  }

  // 3. Merge: user foods first, then API foods (skip API foods with same name as user food)
  const userFoodNames = new Set(userFoods.map(f => f.name.toLowerCase()));
  const filteredApiFoods = apiFoods.filter(f => !userFoodNames.has((f.description || '').toLowerCase()));
  // Tag user foods for UI
  const userFoodsForUI = userFoods.map(f => ({
    ...f,
    isUserFood: true,
    fdcId: f.id, // for compatibility
    description: f.name,
    foodNutrients: [
      { nutrientName: 'Energy', value: f.calories },
      { nutrientName: 'Protein', value: f.protein },
      { nutrientName: 'Carbohydrate, by difference', value: f.carbs },
      { nutrientName: 'Total lipid (fat)', value: f.fat },
    ],
    baseServing: f.servingSize || 100, // for UI scaling
  }));
  return [...userFoodsForUI, ...filteredApiFoods];
}

export async function addUserFood(food: Omit<UserFood, 'id'>) {
  const foodsRef = collection(db, 'foods');
  const docRef = await addDoc(foodsRef, food);
  return docRef.id;
} 