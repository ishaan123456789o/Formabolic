import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Dumbbell, 
  Apple, 
  TrendingUp, 
  Video,
  Menu,
  X,
  History,
  LogOut
} from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './config/firebase';
import { signOut } from 'firebase/auth';
import Dashboard from './components/Dashboard';
import WorkoutTracker from './components/WorkoutTracker';
import NutritionTracker from './components/NutritionTracker';
import ProgressTracker from './components/ProgressTracker';
import VideoFormCheck from './components/VideoFormCheck';
import WorkoutHistory from './components/WorkoutHistory';
import Login from './components/Login';
import Logo from './components/Logo';

function App() {
  const [user, loading] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    signOut(auth);
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: Home },
    { id: 'workout', name: 'Workouts', icon: Dumbbell },
    { id: 'history', name: 'History', icon: History },
    { id: 'nutrition', name: 'Nutrition', icon: Apple },
    { id: 'progress', name: 'Progress', icon: TrendingUp },
    { id: 'form-check', name: 'Form Check', icon: Video },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onTabChange={setActiveTab} />;
      case 'workout':
        return <WorkoutTracker />;
      case 'history':
        return <WorkoutHistory />;
      case 'nutrition':
        return <NutritionTracker />;
      case 'progress':
        return <ProgressTracker />;
      case 'form-check':
        return <VideoFormCheck />;
      default:
        return <Dashboard onTabChange={setActiveTab} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-400"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25 text-2xl">
                <Logo className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-purple-400 bg-clip-text text-transparent">
                Formabolic
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-green-500/20 to-purple-500/20 text-green-400 font-medium border border-green-500/30 shadow-lg shadow-green-500/10'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.name}
                  </button>
                );
              })}
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-lg flex items-center gap-2 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-700 bg-gray-800">
            <nav className="px-4 py-2 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-green-500/20 to-purple-500/20 text-green-400 font-medium border border-green-500/30'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.name}
                  </button>
                );
              })}
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-3 rounded-lg flex items-center gap-3 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;