import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import MatrixRain from './components/ui/MatrixRain';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-xs font-mono text-gray-600 flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-accent animate-spin" />
          <span className="text-gray-500">booting sentinela</span>
          <span className="animate-blink text-accent">_</span>
        </div>
      </div>
    );
  }

  if (!user) {
    if (authMode === 'signup') {
      return <SignUp onSwitchToLogin={() => setAuthMode('login')} />;
    }
    return <Login onSwitchToSignUp={() => setAuthMode('signup')} />;
  }

  return <Dashboard />;
}

function App() {
  return (
    <AuthProvider>
      <MatrixRain />
      <div style={{ position: 'relative', zIndex: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;
