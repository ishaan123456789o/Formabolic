import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Trash2, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { getWorkoutData, saveWorkoutData } from '../utils/storage';
import { Workout } from '../types';

export default function WorkoutHistory() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'duration'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      const data = await getWorkoutData();
      const allWorkouts = data && data.workouts ? data.workouts : [];
      const sorted = [...allWorkouts].sort((a, b) => {
        if (sortBy === 'date') {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        } else {
          return sortOrder === 'desc' ? b.duration - a.duration : a.duration - b.duration;
        }
      });
      setWorkouts(sorted);
    } catch (error) {
      setWorkouts([]);
    }
  };

  useEffect(() => {
    loadWorkouts();
  }, [sortBy, sortOrder]);

  const handleDeleteWorkout = async (workoutId: string) => {
    if (confirm('Are you sure you want to delete this workout?')) {
      // Remove from Firestore
      const data = await getWorkoutData();
      const allWorkouts = data && data.workouts ? data.workouts : [];
      const updatedWorkouts = allWorkouts.filter((workout: any) => workout.id !== workoutId);
      await saveWorkoutData({ workouts: updatedWorkouts });
      loadWorkouts();
    }
  };

  const toggleExpanded = (workoutId: string) => {
    setExpandedWorkout(expandedWorkout === workoutId ? null : workoutId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUniqueExercises = (workout: Workout) => {
    const exercises = new Set(workout.sets.map(set => set.exerciseName));
    return Array.from(exercises);
  };

  if (workouts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6">Workout History</h2>
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Workouts Yet</h3>
            <p className="text-gray-500">Start tracking your workouts to see them here!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-white">Workout History</h2>
          
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'duration')}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="date">Sort by Date</option>
              <option value="duration">Sort by Duration</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600 transition-colors"
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-400 mb-4">
          Total Workouts: {workouts.length}
        </div>
      </div>

      <div className="space-y-4">
        {workouts.map((workout) => (
          <div
            key={workout.id}
            className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 hover:border-green-500/30 transition-all duration-300"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-500/20 rounded-lg border border-green-500/30">
                    <Calendar className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {formatDate(workout.date)}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {workout.duration} min
                      </span>
                      <span>{workout.sets.length} sets</span>
                      <span>{getUniqueExercises(workout).length} exercises</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleExpanded(workout.id)}
                    className="p-2 text-gray-400 hover:text-green-400 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {expandedWorkout === workout.id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteWorkout(workout.id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                  <div className="text-lg font-bold text-green-400">{workout.sets.length}</div>
                  <div className="text-xs text-gray-400">Total Sets</div>
                </div>
                <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                  <div className="text-lg font-bold text-purple-400">{getUniqueExercises(workout).length}</div>
                  <div className="text-xs text-gray-400">Exercises</div>
                </div>
                <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                  <div className="text-lg font-bold text-purple-400">{workout.duration}</div>
                  <div className="text-xs text-gray-400">Minutes</div>
                </div>
              </div>

              {expandedWorkout === workout.id && (
                <div className="border-t border-gray-700 pt-4 mt-4">
                  <h4 className="text-lg font-semibold text-white mb-3">Workout Details</h4>
                  
                  <div className="space-y-3">
                    {getUniqueExercises(workout).map((exerciseName) => {
                      const exerciseSets = workout.sets.filter(set => set.exerciseName === exerciseName);
                      return (
                        <div key={exerciseName} className="bg-gray-700/30 p-4 rounded-lg">
                          <h5 className="font-medium text-green-400 mb-2">{exerciseName}</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {exerciseSets.map((set, index) => (
                              <div key={set.id} className="text-sm text-gray-300 bg-gray-800/50 p-2 rounded">
                                Set {index + 1}: {set.weight} lbs × {set.reps} reps
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {workout.notes && (
                    <div className="mt-4 p-4 bg-gray-700/30 rounded-lg">
                      <h5 className="font-medium text-purple-400 mb-2">Notes</h5>
                      <p className="text-gray-300 text-sm">{workout.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}