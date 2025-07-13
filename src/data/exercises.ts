import { Exercise } from '../types';

export const exercises: Exercise[] = [
  // Chest
  { id: '1', name: 'Bench Press', category: 'Chest', muscleGroups: ['Chest', 'Triceps', 'Shoulders'] },
  { id: '2', name: 'Incline Bench Press', category: 'Chest', muscleGroups: ['Upper Chest', 'Triceps', 'Shoulders'] },
  { id: '3', name: 'Dumbbell Press', category: 'Chest', muscleGroups: ['Chest', 'Triceps', 'Shoulders'] },
  { id: '4', name: 'Incline Dumbbell Press', category: 'Chest', muscleGroups: ['Upper Chest', 'Triceps', 'Shoulders'] },
  { id: '5', name: 'Dips', category: 'Chest', muscleGroups: ['Lower Chest', 'Triceps'] },
  { id: '6', name: 'Push-ups', category: 'Chest', muscleGroups: ['Chest', 'Triceps', 'Core'] },
  { id: '7', name: 'Chest Flyes', category: 'Chest', muscleGroups: ['Chest'] },
  { id: '8', name: 'Cable Crossover', category: 'Chest', muscleGroups: ['Chest'] },

  // Back
  { id: '9', name: 'Deadlift', category: 'Back', muscleGroups: ['Lower Back', 'Glutes', 'Hamstrings', 'Traps'] },
  { id: '10', name: 'Pull-ups', category: 'Back', muscleGroups: ['Lats', 'Rhomboids', 'Biceps'] },
  { id: '11', name: 'Chin-ups', category: 'Back', muscleGroups: ['Lats', 'Rhomboids', 'Biceps'] },
  { id: '12', name: 'Barbell Rows', category: 'Back', muscleGroups: ['Middle Traps', 'Rhomboids', 'Lats'] },
  { id: '13', name: 'T-Bar Rows', category: 'Back', muscleGroups: ['Middle Traps', 'Rhomboids', 'Lats'] },
  { id: '14', name: 'Seated Cable Rows', category: 'Back', muscleGroups: ['Middle Traps', 'Rhomboids', 'Lats'] },
  { id: '15', name: 'Lat Pulldowns', category: 'Back', muscleGroups: ['Lats', 'Rhomboids', 'Biceps'] },
  { id: '16', name: 'Single-Arm Dumbbell Rows', category: 'Back', muscleGroups: ['Lats', 'Rhomboids', 'Rear Delts'] },

  // Legs
  { id: '17', name: 'Squats', category: 'Legs', muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'] },
  { id: '18', name: 'Front Squats', category: 'Legs', muscleGroups: ['Quadriceps', 'Core'] },
  { id: '19', name: 'Leg Press', category: 'Legs', muscleGroups: ['Quadriceps', 'Glutes'] },
  { id: '20', name: 'Lunges', category: 'Legs', muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'] },
  { id: '21', name: 'Bulgarian Split Squats', category: 'Legs', muscleGroups: ['Quadriceps', 'Glutes'] },
  { id: '22', name: 'Romanian Deadlifts', category: 'Legs', muscleGroups: ['Hamstrings', 'Glutes', 'Lower Back'] },
  { id: '23', name: 'Leg Curls', category: 'Legs', muscleGroups: ['Hamstrings'] },
  { id: '24', name: 'Leg Extensions', category: 'Legs', muscleGroups: ['Quadriceps'] },
  { id: '25', name: 'Calf Raises', category: 'Legs', muscleGroups: ['Calves'] },

  // Shoulders
  { id: '26', name: 'Overhead Press', category: 'Shoulders', muscleGroups: ['Shoulders', 'Triceps', 'Core'] },
  { id: '27', name: 'Dumbbell Shoulder Press', category: 'Shoulders', muscleGroups: ['Shoulders', 'Triceps'] },
  { id: '28', name: 'Lateral Raises', category: 'Shoulders', muscleGroups: ['Side Delts'] },
  { id: '29', name: 'Front Raises', category: 'Shoulders', muscleGroups: ['Front Delts'] },
  { id: '30', name: 'Rear Delt Flyes', category: 'Shoulders', muscleGroups: ['Rear Delts'] },
  { id: '31', name: 'Upright Rows', category: 'Shoulders', muscleGroups: ['Side Delts', 'Traps'] },
  { id: '32', name: 'Shrugs', category: 'Shoulders', muscleGroups: ['Traps'] },

  // Arms
  { id: '33', name: 'Barbell Curls', category: 'Arms', muscleGroups: ['Biceps'] },
  { id: '34', name: 'Dumbbell Curls', category: 'Arms', muscleGroups: ['Biceps'] },
  { id: '35', name: 'Hammer Curls', category: 'Arms', muscleGroups: ['Biceps', 'Forearms'] },
  { id: '36', name: 'Preacher Curls', category: 'Arms', muscleGroups: ['Biceps'] },
  { id: '37', name: 'Tricep Dips', category: 'Arms', muscleGroups: ['Triceps'] },
  { id: '38', name: 'Close-Grip Bench Press', category: 'Arms', muscleGroups: ['Triceps', 'Chest'] },
  { id: '39', name: 'Tricep Extensions', category: 'Arms', muscleGroups: ['Triceps'] },
  { id: '40', name: 'Overhead Tricep Extension', category: 'Arms', muscleGroups: ['Triceps'] },

  // Core
  { id: '41', name: 'Planks', category: 'Core', muscleGroups: ['Core', 'Shoulders'] },
  { id: '42', name: 'Sit-ups', category: 'Core', muscleGroups: ['Abs'] },
  { id: '43', name: 'Crunches', category: 'Core', muscleGroups: ['Abs'] },
  { id: '44', name: 'Russian Twists', category: 'Core', muscleGroups: ['Obliques'] },
  { id: '45', name: 'Leg Raises', category: 'Core', muscleGroups: ['Lower Abs'] },
  { id: '46', name: 'Mountain Climbers', category: 'Core', muscleGroups: ['Core', 'Cardio'] },
  { id: '47', name: 'Dead Bug', category: 'Core', muscleGroups: ['Core'] },
  { id: '48', name: 'Bird Dog', category: 'Core', muscleGroups: ['Core', 'Lower Back'] }
];

export const exerciseCategories = [
  'All',
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Arms',
  'Core'
];