import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, TrendingUp } from 'lucide-react';
import { exercises, exerciseCategories } from '../data/exercises';
import { saveWorkoutData, getWorkoutData } from '../utils/storage';
import { Workout, WorkoutSet } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { auth } from '../config/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Combobox } from '@headlessui/react';

export default function WorkoutTracker() {
  const [user, loading] = useAuthState(auth);
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutSet[]>([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showProgress, setShowProgress] = useState<string | null>(null);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [progressData, setProgressData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [firstSetTimestamp, setFirstSetTimestamp] = useState<number | null>(null);

  useEffect(() => {
    const loadWorkoutData = async () => {
      if (user) {
        try {
          setIsLoading(true);
          const data = await getWorkoutData();
          if (data && data.workouts) {
            setProgressData(data.workouts);
          } else {
            setProgressData([]); // Initialize with empty array if no data
          }
        } catch (error) {
          console.error('Error loading workout data:', error);
          setProgressData([]); // Reset on error
        } finally {
          setIsLoading(false);
        }
      } else if (!loading) {
        // If not loading and no user, reset data
        setProgressData([]);
        setIsLoading(false);
      }
    };

    loadWorkoutData();
  }, [user, loading]);

  const filteredExercises = exercises.filter(exercise => {
    const matchesCategory = categoryFilter === 'All' || exercise.category === categoryFilter;
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addSet = () => {
    if (!user) {
      alert('Please sign in to track your workouts');
      return;
    }

    if ((selectedExercise || customExerciseName) && weight && reps) {
      const exercise = exercises.find(e => e.id === selectedExercise);
      const exerciseName = exercise ? exercise.name : customExerciseName;
      const now = Date.now();
      if (!firstSetTimestamp) setFirstSetTimestamp(now);
      const newSet: WorkoutSet = {
        id: now.toString(),
        exerciseId: selectedExercise || 'custom',
        exerciseName,
        weight: parseFloat(weight),
        reps: parseInt(reps),
        date: new Date().toISOString().split('T')[0]
      };
      setCurrentWorkout([...currentWorkout, newSet]);
      setWeight('');
      setReps('');
      setCustomExerciseName('');
    }
  };

  const removeSet = (id: string) => {
    setCurrentWorkout(currentWorkout.filter(set => set.id !== id));
  };

  const saveCurrentWorkout = async () => {
    if (!user) {
      alert('Please sign in to save your workout');
      return;
    }

    if (currentWorkout.length > 0) {
      try {
        const now = Date.now();
        const duration = firstSetTimestamp ? Math.max(1, Math.round((now - firstSetTimestamp) / 60000)) : 1;
        const workout: Workout = {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          sets: currentWorkout,
          duration,
          notes: workoutNotes,
          userId: user.uid // Add user ID to workout data
        };

        // Get existing workouts for this user
        const existingData = await getWorkoutData() || { workouts: [] };
        const updatedWorkouts = [...(existingData.workouts || []), workout];
        // Save updated workouts
        await saveWorkoutData({ workouts: updatedWorkouts });
        setCurrentWorkout([]);
        setWorkoutNotes('');
        setFirstSetTimestamp(null);
        setProgressData(updatedWorkouts);
        alert('Workout saved successfully!');
      } catch (error) {
        console.error('Error saving workout:', error);
        alert('Error saving workout. Please try again.');
      }
    }
  };

  const showExerciseProgress = (exerciseId: string) => {
    setShowProgress(exerciseId);
  };

  const getExerciseProgressData = (exerciseId: string) => {
    return progressData
      .flatMap(workout => workout.sets)
      .filter(set => set.exerciseId === exerciseId)
      .map((set, index) => ({
        session: index + 1,
        weight: set.weight,
        reps: set.reps,
        date: set.date
      }));
  };

  const chartData = showProgress ? getExerciseProgressData(showProgress) : [];

  return (
    <div className="space-y-6">
      {loading || isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : !user ? (
        <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-200 p-4 rounded-lg">
          Please sign in to track and save your workouts
        </div>
      ) : (
        <>
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">Workout Tracker</h2>
            
            {/* Exercise Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {exerciseCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Select Exercise</label>
                <Combobox
                  value={selectedExercise}
                  onChange={(value) => {
                    const safeValue = typeof value === 'string' ? value : '';
                    setSelectedExercise(safeValue);
                    if (safeValue) setCustomExerciseName('');
                    if (!safeValue) setCustomExerciseName('');
                  }}
                  disabled={!!customExerciseName}
                >
                  <div className="relative">
                    <Combobox.Input
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      displayValue={(id: string) => {
                        const found = exercises.find(e => e.id === id);
                        return found ? found.name : '';
                      }}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search or select exercise..."
                      disabled={!!customExerciseName}
                    />
                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </Combobox.Button>
                    <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm border border-gray-700">
                      {filteredExercises.length === 0 && searchTerm !== '' ? (
                        <div className="cursor-default select-none py-2 px-4 text-gray-400">
                          No exercises found.
                        </div>
                      ) : (
                        filteredExercises.map((exercise) => (
                          <Combobox.Option
                            key={exercise.id}
                            value={exercise.id}
                            className={({ active }) =>
                              `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                active ? 'bg-green-600 text-white' : 'text-gray-200'
                              }`
                            }
                          >
                            {({ selected, active }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>{exercise.name}</span>
                                {selected ? (
                                  <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-green-400'}`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                  </span>
                                ) : null}
                              </>
                            )}
                          </Combobox.Option>
                        ))
                      )}
                    </Combobox.Options>
                  </div>
                </Combobox>
                {customExerciseName && (
                  <div className="text-xs text-yellow-400 mt-1">Clear custom exercise to select from the list.</div>
                )}
              </div>
            </div>

            {/* Custom Exercise Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Or Enter Custom Exercise</label>
              <input
                type="text"
                value={customExerciseName}
                onChange={(e) => {
                  setCustomExerciseName(e.target.value);
                  if (e.target.value) setSelectedExercise('');
                }}
                placeholder="Custom exercise name..."
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={!!selectedExercise}
              />
              {selectedExercise && (
                <div className="text-xs text-yellow-400 mt-1">Clear dropdown selection to enter a custom exercise.</div>
              )}
            </div>

            {/* Weight and Reps Input */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Weight (lbs)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Reps</label>
                <input
                  type="number"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  placeholder="0"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={addSet}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white p-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-green-500/25"
                >
                  <Plus className="w-4 h-4" />
                  Add Set
                </button>
              </div>
            </div>
          </div>

          {/* Current Workout */}
          {currentWorkout.length > 0 && (
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Current Workout</h3>
              
              <div className="space-y-3 mb-6">
                {currentWorkout.map((set, index) => (
                  <div key={set.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                    <div className="flex-1">
                      <span className="font-medium text-white">{set.exerciseName}</span>
                      <div className="text-sm text-gray-400 mt-1">
                        Set {index + 1}: <span className="text-green-400">{set.weight} lbs</span> × <span className="text-purple-400">{set.reps} reps</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => showExerciseProgress(set.exerciseId)}
                        className="p-2 text-green-400 hover:bg-gray-600 rounded-lg transition-colors"
                      >
                        <TrendingUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeSet(set.id)}
                        className="p-2 text-red-400 hover:bg-gray-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Workout Notes</label>
                <textarea
                  value={workoutNotes}
                  onChange={(e) => setWorkoutNotes(e.target.value)}
                  placeholder="How did the workout feel? Any observations?"
                  rows={3}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={saveCurrentWorkout}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white p-3 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
              >
                <Save className="w-4 h-4" />
                Save Workout
              </button>
            </div>
          )}

          {/* Progress Chart Modal */}
          {showProgress && chartData.length > 0 && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
              <div className="bg-gray-800 p-6 rounded-xl max-w-4xl w-full max-h-96 overflow-y-auto border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">
                    Progress: {exercises.find(e => e.id === showProgress)?.name || 'Custom Exercise'}
                  </h3>
                  <button
                    onClick={() => setShowProgress(null)}
                    className="text-gray-400 hover:text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="session" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
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
            </div>
          )}
        </>
      )}
    </div>
  );
}