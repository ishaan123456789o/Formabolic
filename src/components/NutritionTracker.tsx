import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Target, TrendingUp, User } from 'lucide-react';
import { saveNutritionEntry, getNutritionEntries, saveNutritionGoals, getNutritionGoals } from '../utils/storage';
import { NutritionEntry, Meal, NutritionGoals } from '../types';
import { searchFoods, addUserFood } from '../utils/foodDataCentral';
import { UserFood } from '../types';
import { auth } from '../config/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

export default function NutritionTracker() {
  const [user] = useAuthState(auth);
  const db = getFirestore();
  const [todayEntry, setTodayEntry] = useState<NutritionEntry | null>(null);
  const [goals, setGoals] = useState<NutritionGoals>({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65
  });
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [newMeal, setNewMeal] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    time: new Date().toTimeString().slice(0, 5)
  });
  const [foodSearch, setFoodSearch] = useState('');
  const [foodResults, setFoodResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  // Change servingSizes state type to allow ''
  const [servingSizes, setServingSizes] = useState<{ [fdcId: string]: number | '' }>({});
  // Add state for showAddFoodModal, addFoodForm, addFoodLoading, addFoodSuccess, addFoodError
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [addFoodForm, setAddFoodForm] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    description: '',
    servingSize: '',
  });
  const [addFoodLoading, setAddFoodLoading] = useState(false);
  const [addFoodSuccess, setAddFoodSuccess] = useState(false);
  const [addFoodError, setAddFoodError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  // Track the current date and reload at midnight
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().toISOString().split('T')[0];
      if (now !== currentDate) {
        setCurrentDate(now);
      }
    }, 60000); // check every minute
    return () => clearInterval(interval);
  }, [currentDate]);

  // Load today's meals from Firestore on mount or when user/date changes
  useEffect(() => {
    const fetchMeals = async () => {
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      const docRef = doc(db, 'nutritionEntries', user.uid, 'days', today);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Fill in missing fields with defaults
        setTodayEntry({
          id: data.id || Date.now().toString(),
          date: data.date || today,
          calories: data.calories || 0,
          protein: data.protein || 0,
          carbs: data.carbs || 0,
          fat: data.fat || 0,
          meals: data.meals || [],
          notes: data.notes || '',
        });
      } else {
        setTodayEntry({
          id: Date.now().toString(),
          date: today,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          meals: [],
          notes: '',
        });
      }
    };
    fetchMeals();
    // eslint-disable-next-line
  }, [user, currentDate]);

  // Save today's meals to Firestore whenever they change
  useEffect(() => {
    const saveMeals = async () => {
      if (!user || !todayEntry) return;
      const today = new Date().toISOString().split('T')[0];
      const docRef = doc(db, 'nutritionEntries', user.uid, 'days', today);
      await setDoc(docRef, todayEntry);
    };
    saveMeals();
    // eslint-disable-next-line
  }, [todayEntry, user]);

  // Calculate total macros for today
  const totalMacros = (todayEntry?.meals || []).reduce(
    (acc, meal) => {
      acc.calories += meal.calories || 0;
      acc.protein += meal.protein || 0;
      acc.carbs += meal.carbs || 0;
      acc.fat += meal.fat || 0;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  useEffect(() => {
    setGoals(getNutritionGoals());
  }, [today]);

  const addMeal = () => {
    if (!todayEntry || !newMeal.name || !newMeal.calories) return;

    const meal: Meal = {
      id: Date.now().toString(),
      name: newMeal.name,
      calories: parseFloat(newMeal.calories),
      protein: parseFloat(newMeal.protein) || 0,
      carbs: parseFloat(newMeal.carbs) || 0,
      fat: parseFloat(newMeal.fat) || 0,
      time: newMeal.time
    };

    const updatedEntry: NutritionEntry = {
      ...todayEntry,
      meals: [...todayEntry.meals, meal],
      calories: todayEntry.calories + meal.calories,
      protein: todayEntry.protein + meal.protein,
      carbs: todayEntry.carbs + meal.carbs,
      fat: todayEntry.fat + meal.fat,
      notes: todayEntry.notes || '' // Ensure notes is always present
    };

    setTodayEntry(updatedEntry);
    saveNutritionEntry(updatedEntry);

    setNewMeal({
      name: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      time: new Date().toTimeString().slice(0, 5)
    });
  };

  const removeMeal = (mealId: string) => {
    if (!todayEntry) return;

    const mealToRemove = todayEntry.meals.find(m => m.id === mealId);
    if (!mealToRemove) return;

    const updatedEntry: NutritionEntry = {
      ...todayEntry,
      meals: todayEntry.meals.filter(m => m.id !== mealId),
      calories: todayEntry.calories - mealToRemove.calories,
      protein: todayEntry.protein - mealToRemove.protein,
      carbs: todayEntry.carbs - mealToRemove.carbs,
      fat: todayEntry.fat - mealToRemove.fat,
      notes: todayEntry.notes || '' // Ensure notes is always present
    };

    setTodayEntry(updatedEntry);
    saveNutritionEntry(updatedEntry);
  };

  const updateGoals = (newGoals: NutritionGoals) => {
    setGoals(newGoals);
    saveNutritionGoals(newGoals);
    setShowGoalsModal(false);
  };

  const getProgressPercentage = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const getProgressColor = (current: number, goal: number) => {
    const percentage = (current / goal) * 100;
    if (percentage < 50) return 'from-red-500 to-red-600';
    if (percentage < 80) return 'from-yellow-500 to-yellow-600';
    return 'from-green-500 to-green-600';
  };

  const handleFoodSearch = async () => {
    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await searchFoods(foodSearch);
      setFoodResults(results);
    } catch (err: any) {
      setSearchError(err.message || 'Search failed');
      setFoodResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleServingSizeChange = (fdcId: string, value: number | '') => {
    setServingSizes(prev => ({ ...prev, [fdcId]: value }));
  };

  const addFoodToToday = (food: any, servingSize?: number) => {
    // Extract basic nutrition info (calories, protein, carbs, fat)
    const nutrients = (food.foodNutrients || []).reduce((acc: any, n: any) => {
      if (n.nutrientName === 'Energy') acc.calories = n.value;
      if (n.nutrientName === 'Protein') acc.protein = n.value;
      if (n.nutrientName === 'Carbohydrate, by difference') acc.carbs = n.value;
      if (n.nutrientName === 'Total lipid (fat)') acc.fat = n.value;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    // Default serving size is 100g
    const baseServing = 100;
    const size = servingSize || servingSizes[food.fdcId] || baseServing;
    const scale = size / baseServing;
    const newMeal = {
      id: Date.now().toString(),
      name: food.description + ` (${size}g)`,
      calories: Math.round(nutrients.calories * scale),
      protein: +(nutrients.protein * scale).toFixed(1),
      carbs: +(nutrients.carbs * scale).toFixed(1),
      fat: +(nutrients.fat * scale).toFixed(1),
      time: new Date().toTimeString().slice(0, 5),
    };
    setTodayEntry((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        meals: [...prev.meals, newMeal],
        notes: prev.notes || '', // Ensure notes is always present
      };
    });
  };

  // Add handleAddFood function
  const handleAddFood = async () => {
    setAddFoodLoading(true);
    setAddFoodError(null);
    try {
      await addUserFood({
        name: addFoodForm.name,
        calories: parseFloat(addFoodForm.calories),
        protein: parseFloat(addFoodForm.protein),
        carbs: parseFloat(addFoodForm.carbs),
        fat: parseFloat(addFoodForm.fat),
        description: addFoodForm.description,
        servingSize: parseFloat(addFoodForm.servingSize) || 100,
      });
      setAddFoodSuccess(true);
      setShowAddFoodModal(false);
      setAddFoodForm({ name: '', calories: '', protein: '', carbs: '', fat: '', description: '', servingSize: '' });
    } catch (err: any) {
      setAddFoodError(err.message || 'Failed to add food');
    } finally {
      setAddFoodLoading(false);
    }
  };

  if (!todayEntry) return <div className="text-white">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Food Search Bar */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Search Food Database</h2>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={foodSearch}
            onChange={e => setFoodSearch(e.target.value)}
            placeholder="Search for a food (e.g. chicken, rice, apple)"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <button
            onClick={handleFoodSearch}
            disabled={isSearching || !foodSearch}
            className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium btn-glow-blue disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
        {searchError && <div className="text-red-400 mb-2">{searchError}</div>}
        {/* Add Food Modal */}
        {foodResults.length > 0 && (
          <div className="bg-gray-900 p-4 rounded-lg shadow-lg w-full max-h-60 overflow-y-auto border border-gray-700">
            {foodResults.map(food => {
              // Use food.baseServing (for user foods) or 100g (for API foods)
              const baseServing = food.baseServing || 100;
              const servingRaw = servingSizes[food.fdcId];
              const serving = servingRaw === undefined ? baseServing : servingRaw;
              const nutrients = (food.foodNutrients || []).reduce((acc: any, n: any) => {
                if (n.nutrientName === 'Energy') acc.calories = n.value;
                if (n.nutrientName === 'Protein') acc.protein = n.value;
                if (n.nutrientName === 'Carbohydrate, by difference') acc.carbs = n.value;
                if (n.nutrientName === 'Total lipid (fat)') acc.fat = n.value;
                return acc;
              }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
              const isServingEmpty = servingRaw === '' || servingRaw === undefined || isNaN(Number(servingRaw)) || Number(servingRaw) <= 0;
              const scale = isServingEmpty ? 0 : Number(serving) / baseServing;
              return (
                <div key={food.fdcId} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-3 mb-2 bg-gray-800 rounded-lg border border-gray-700">
                  <div className="flex-1">
                    <div className="text-white font-medium flex items-center gap-2">
                      {food.description}
                      {food.isUserFood && (
                        <div className="relative group inline-block ml-1 align-middle">
                          <User className="w-4 h-4 text-green-400 cursor-pointer" />
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max px-3 py-1 rounded bg-gray-900 text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 shadow-lg border border-gray-700">
                            This food was added by a Formabolic user.
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <label className="text-gray-400 text-sm">Serving size:</label>
                      <input
                        type="number"
                        min={1}
                        value={servingRaw === undefined ? baseServing : servingRaw}
                        onChange={e => handleServingSizeChange(food.fdcId, e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-20 p-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                      />
                      <span className="text-gray-400 text-sm">g</span>
                    </div>
                    <div className="text-gray-400 text-sm mt-1">
                      Calories: {isServingEmpty ? '--' : Math.round(nutrients.calories * scale) + ' kcal'}, Protein: {isServingEmpty ? '--' : (nutrients.protein * scale).toFixed(1) + 'g'}, Carbs: {isServingEmpty ? '--' : (nutrients.carbs * scale).toFixed(1) + 'g'}, Fat: {isServingEmpty ? '--' : (nutrients.fat * scale).toFixed(1) + 'g'}
                    </div>
                  </div>
                  <button
                    onClick={() => !isServingEmpty && addFoodToToday(food, Number(serving))}
                    className={`px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium btn-glow-green hover:from-green-600 hover:to-green-700 ${isServingEmpty ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isServingEmpty}
                  >
                    Add
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {/* Add New Food Button */}
        <button
          onClick={() => setShowAddFoodModal(true)}
          className="mt-4 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium btn-glow-green"
        >
          Add New Food
        </button>
      </div>
      {/* Today's Nutrition */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Today's Nutrition</h2>
          <button
            onClick={() => setShowGoalsModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-purple-500/25"
          >
            <span>Set Goals</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="flex flex-col items-center">
            <div className="relative w-20 h-20 mb-2">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  className="text-gray-700"
                  strokeDasharray="100, 100"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="text-green-400"
                  strokeDasharray={`${Math.min((totalMacros.calories / (goals.calories || 1)) * 100, 100)}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{Math.round((totalMacros.calories / (goals.calories || 1)) * 100)}%</span>
              </div>
            </div>
            <div className="text-gray-300 font-semibold">Calories</div>
            <div className="text-gray-400 text-sm">{totalMacros.calories}/{goals.calories || 0}</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-full h-4 bg-gray-700 rounded-full mb-2">
              <div
                className="h-4 bg-purple-500 rounded-full"
                style={{ width: `${Math.min((totalMacros.protein / (goals.protein || 1)) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="text-gray-300 font-semibold">Protein</div>
            <div className="text-gray-400 text-sm">{totalMacros.protein}g/{goals.protein || 0}g</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-full h-4 bg-gray-700 rounded-full mb-2">
              <div
                className="h-4 bg-blue-500 rounded-full"
                style={{ width: `${Math.min((totalMacros.carbs / (goals.carbs || 1)) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="text-gray-300 font-semibold">Carbs</div>
            <div className="text-gray-400 text-sm">{totalMacros.carbs}g/{goals.carbs || 0}g</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-full h-4 bg-gray-700 rounded-full mb-2">
              <div
                className="h-4 bg-yellow-400 rounded-full"
                style={{ width: `${Math.min((totalMacros.fat / (goals.fat || 1)) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="text-gray-300 font-semibold">Fat</div>
            <div className="text-gray-400 text-sm">{totalMacros.fat}g/{goals.fat || 0}g</div>
          </div>
        </div>
      </div>

      {/* Add Meal */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Add Meal</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Meal Name</label>
            <input
              type="text"
              value={newMeal.name}
              onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })}
              placeholder="e.g., Grilled Chicken Breast"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Calories</label>
            <input
              type="number"
              value={newMeal.calories}
              onChange={(e) => setNewMeal({ ...newMeal, calories: e.target.value })}
              placeholder="0"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
            <input
              type="time"
              value={newMeal.time}
              onChange={(e) => setNewMeal({ ...newMeal, time: e.target.value })}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Protein (g)</label>
            <input
              type="number"
              value={newMeal.protein}
              onChange={(e) => setNewMeal({ ...newMeal, protein: e.target.value })}
              placeholder="0"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Carbs (g)</label>
            <input
              type="number"
              value={newMeal.carbs}
              onChange={(e) => setNewMeal({ ...newMeal, carbs: e.target.value })}
              placeholder="0"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Fat (g)</label>
            <input
              type="number"
              value={newMeal.fat}
              onChange={(e) => setNewMeal({ ...newMeal, fat: e.target.value })}
              placeholder="0"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={addMeal}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white p-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-green-500/25"
            >
              <Plus className="w-4 h-4" />
              Add Meal
            </button>
          </div>
        </div>
      </div>

      {/* Today's Meals */}
      {todayEntry.meals.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Today's Meals</h3>
          
          <div className="space-y-3">
            {todayEntry.meals.map(meal => (
              <div key={meal.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-white">{meal.name}</span>
                    <span className="text-sm text-gray-400">{meal.time}</span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    <span className="text-green-400">{meal.calories} cal</span> • 
                    <span className="text-purple-400"> {meal.protein}g protein</span> • 
                    <span className="text-green-400"> {meal.carbs}g carbs</span> • 
                    <span className="text-purple-400"> {meal.fat}g fat</span>
                  </div>
                </div>
                <button
                  onClick={() => removeMeal(meal.id)}
                  className="p-2 text-red-400 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goals Modal */}
      {showGoalsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl max-w-md w-full border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Set Daily Goals</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Daily Calories</label>
                <input
                  type="number"
                  value={goals.calories}
                  onChange={(e) => setGoals({ ...goals, calories: parseInt(e.target.value) })}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Daily Protein (g)</label>
                <input
                  type="number"
                  value={goals.protein}
                  onChange={(e) => setGoals({ ...goals, protein: parseInt(e.target.value) })}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Daily Carbs (g)</label>
                <input
                  type="number"
                  value={goals.carbs}
                  onChange={(e) => setGoals({ ...goals, carbs: parseInt(e.target.value) })}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Daily Fat (g)</label>
                <input
                  type="number"
                  value={goals.fat}
                  onChange={(e) => setGoals({ ...goals, fat: parseInt(e.target.value) })}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowGoalsModal(false)}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => updateGoals(goals)}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200"
              >
                Save Goals
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Food Modal */}
      {showAddFoodModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl max-w-md w-full border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Add New Food</h3>
            {addFoodError && <div className="text-red-400 mb-2">{addFoodError}</div>}
            {addFoodSuccess && (
              <div className="text-green-400 mb-2">Food added successfully!</div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={addFoodForm.name}
                  onChange={(e) => setAddFoodForm({ ...addFoodForm, name: e.target.value })}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Calories</label>
                <input
                  type="number"
                  value={addFoodForm.calories}
                  onChange={(e) => setAddFoodForm({ ...addFoodForm, calories: e.target.value })}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Protein (g)</label>
                <input
                  type="number"
                  value={addFoodForm.protein}
                  onChange={(e) => setAddFoodForm({ ...addFoodForm, protein: e.target.value })}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Carbs (g)</label>
                <input
                  type="number"
                  value={addFoodForm.carbs}
                  onChange={(e) => setAddFoodForm({ ...addFoodForm, carbs: e.target.value })}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Fat (g)</label>
                <input
                  type="number"
                  value={addFoodForm.fat}
                  onChange={(e) => setAddFoodForm({ ...addFoodForm, fat: e.target.value })}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Serving Size (g)</label>
                <input
                  type="number"
                  value={addFoodForm.servingSize}
                  onChange={e => setAddFoodForm({ ...addFoodForm, servingSize: e.target.value })}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <input
                  type="text"
                  value={addFoodForm.description}
                  onChange={(e) => setAddFoodForm({ ...addFoodForm, description: e.target.value })}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddFoodModal(false)}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFood}
                disabled={addFoodLoading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addFoodLoading ? 'Adding...' : 'Add Food'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}