import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, Scale } from 'lucide-react';
import { getUserBodyWeightEntries, saveUserBodyWeight, getWorkouts } from '../utils/storage';
import { BodyWeightEntry } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';

export default function ProgressTracker() {
  const [user] = useAuthState(auth);
  const [bodyWeightEntries, setBodyWeightEntries] = useState<BodyWeightEntry[]>([]);
  const [newWeight, setNewWeight] = useState('');
  const [showAddWeight, setShowAddWeight] = useState(false);
  
  useEffect(() => {
    const load = async () => {
      const entries = await getUserBodyWeightEntries();
      setBodyWeightEntries(entries);
    };
    load();
  }, [user]);

  const addBodyWeight = async () => {
    if (!newWeight) return;

    const entry: BodyWeightEntry = {
      id: Date.now().toString(),
      weight: parseFloat(newWeight),
      date: new Date().toISOString().split('T')[0]
    };

    await saveUserBodyWeight(entry);
    setBodyWeightEntries(await getUserBodyWeightEntries());
    setNewWeight('');
    setShowAddWeight(false);
  };

  const workouts = getWorkouts();
  const workoutData = workouts.reduce((acc, workout) => {
    const month = workout.date.substring(0, 7); // YYYY-MM
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(workoutData).map(([month, count]) => ({
    month,
    workouts: count
  }));

  const weightChartData = bodyWeightEntries.map(entry => ({
    date: entry.date,
    weight: entry.weight
  }));

  const currentWeight = bodyWeightEntries[bodyWeightEntries.length - 1]?.weight;
  const previousWeight = bodyWeightEntries[bodyWeightEntries.length - 2]?.weight;
  const weightChange = currentWeight && previousWeight ? currentWeight - previousWeight : 0;

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Progress Overview</h2>
          <button
            onClick={() => setShowAddWeight(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg shadow-green-500/25"
          >
            <Scale className="w-4 h-4" />
            Add Weight
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-6 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl border border-green-500/30">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/25">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-green-400 mb-1">{workouts.length}</h3>
            <p className="text-green-300">Total Workouts</p>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl border border-purple-500/30">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-purple-400 mb-1">
              {currentWeight ? `${currentWeight} lbs` : '--'}
            </h3>
            <p className="text-purple-300">Current Weight</p>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-green-500/20 to-purple-500/20 rounded-xl border border-green-500/30">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/25">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-green-400 mb-1">
              {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} lbs
            </h3>
            <p className="text-green-300">Weight Change</p>
          </div>
        </div>
      </div>

      {/* Body Weight Progress */}
      {bodyWeightEntries.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Body Weight Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis domain={['dataMin - 5', 'dataMax + 5']} stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }} 
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Workout Frequency */}
      {chartData.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Monthly Workout Frequency</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }} 
                />
                <Bar dataKey="workouts" fill="#8B5CF6" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Add Weight Modal */}
      {showAddWeight && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl max-w-sm w-full border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Add Body Weight</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Weight (lbs)</label>
              <input
                type="number"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                placeholder="0.0"
                step="0.1"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddWeight(false)}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addBodyWeight}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200"
              >
                Add Weight
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}