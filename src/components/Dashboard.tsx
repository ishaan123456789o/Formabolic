import React from 'react';
import { Calendar, TrendingUp, Target, Zap, Weight, Activity, Dumbbell, Apple, Scale } from 'lucide-react';
import { getUserBodyWeightEntries, getWorkouts } from '../utils/storage';
import { auth } from '../config/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

interface DashboardProps {
  onTabChange: (tab: string) => void;
}

export default function Dashboard({ onTabChange }: DashboardProps) {
  const [user] = useAuthState(auth);
  const db = getFirestore();
  const [dashboardTodayEntry, setDashboardTodayEntry] = React.useState<any>(null);
  const [bodyWeightEntries, setBodyWeightEntries] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchTodayEntry = async () => {
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      const docRef = doc(db, 'nutritionEntries', user.uid, 'days', today);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDashboardTodayEntry({
          id: data.id || Date.now().toString(),
          date: data.date || today,
          meals: data.meals || [],
        });
      } else {
        setDashboardTodayEntry({
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          meals: [],
        });
      }
    };
    fetchTodayEntry();
  }, [user, new Date().toISOString().split('T')[0]]);

  React.useEffect(() => {
    const load = async () => {
      const entries = await getUserBodyWeightEntries();
      setBodyWeightEntries(entries);
    };
    load();
  }, [user]);

  const workouts = getWorkouts();
  // Remove: const bodyWeightEntries = getBodyWeightEntries();

  const today = new Date().toISOString().split('T')[0];
  const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const recentWorkouts = workouts.filter(w => w.date >= thisWeek).length;
  const totalWorkouts = workouts.length;
  const currentWeight = bodyWeightEntries[bodyWeightEntries.length - 1]?.weight || 0;
  // Remove: const todayNutrition = nutritionEntries.find(e => e.date === today);

  const workoutStreak = calculateStreak(workouts);

  const todayMeals = dashboardTodayEntry?.meals || [];
  const todayTotals = todayMeals.reduce(
    (acc, meal) => {
      acc.calories += meal.calories || 0;
      acc.protein += meal.protein || 0;
      return acc;
    },
    { calories: 0, protein: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-purple-600 text-white p-6 rounded-xl shadow-2xl shadow-green-500/20">
        <h1 className="text-2xl font-bold mb-2">Welcome Back!</h1>
        <p className="text-green-100">Ready to crush your fitness goals today?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 hover:border-green-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500/20 rounded-lg border border-green-500/30">
              <Calendar className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-2xl font-bold text-white">{recentWorkouts}</span>
          </div>
          <h3 className="font-semibold text-white mb-1">This Week</h3>
          <p className="text-gray-400 text-sm">Workouts completed</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-2xl font-bold text-white">{workoutStreak}</span>
          </div>
          <h3 className="font-semibold text-white mb-1">Day Streak</h3>
          <p className="text-gray-400 text-sm">Keep it up!</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 hover:border-green-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500/20 rounded-lg border border-green-500/30">
              <Activity className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-2xl font-bold text-white">{totalWorkouts}</span>
          </div>
          <h3 className="font-semibold text-white mb-1">Total Workouts</h3>
          <p className="text-gray-400 text-sm">All time</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
              <Weight className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-2xl font-bold text-white">{currentWeight || '--'}</span>
          </div>
          <h3 className="font-semibold text-white mb-1">Current Weight</h3>
          <p className="text-gray-400 text-sm">lbs</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 hover:border-green-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500/20 rounded-lg border border-green-500/30">
              <Target className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-2xl font-bold text-white">{todayTotals.calories}</span>
          </div>
          <h3 className="font-semibold text-white mb-1">Today's Calories</h3>
          <p className="text-gray-400 text-sm">kcal consumed</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-2xl font-bold text-white">{todayTotals.protein}g</span>
          </div>
          <h3 className="font-semibold text-white mb-1">Protein Today</h3>
          <p className="text-gray-400 text-sm">grams consumed</p>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => onTabChange('workout')}
            className="p-4 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg text-center border border-green-500/30 font-medium btn-glow-green hover:border-green-400/50"
          >
            <Dumbbell className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <span className="text-sm font-medium text-green-300">Start Workout</span>
          </button>
          <button 
            onClick={() => onTabChange('nutrition')}
            className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg text-center border border-purple-500/30 font-medium btn-glow-purple hover:border-purple-400/50"
          >
            <Apple className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <span className="text-sm font-medium text-purple-300">Log Meal</span>
          </button>
          <button 
            onClick={() => onTabChange('progress')}
            className="p-4 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg text-center border border-green-500/30 font-medium btn-glow-green hover:border-green-400/50"
          >
            <Scale className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <span className="text-sm font-medium text-green-300">Weigh In</span>
          </button>
          <button 
            onClick={() => onTabChange('progress')}
            className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg text-center border border-purple-500/30 font-medium btn-glow-purple hover:border-purple-400/50"
          >
            <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <span className="text-sm font-medium text-purple-300">View Progress</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function calculateStreak(workouts: any[]): number {
  if (workouts.length === 0) return 0;
  
  const sortedDates = workouts
    .map(w => w.date)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  let streak = 0;
  let currentDate = new Date();
  
  for (const workoutDate of sortedDates) {
    const workout = new Date(workoutDate);
    const diffTime = currentDate.getTime() - workout.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) {
      streak++;
      currentDate = workout;
    } else {
      break;
    }
  }
  
  return streak;
}