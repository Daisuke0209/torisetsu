import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import ManualEditor from './pages/ManualEditor';
import ManualPlayback from './pages/ManualPlayback';
import SharedManualPlayback from './pages/SharedManualPlayback';
import ScreenRecorder from './pages/ScreenRecorder';
import VideoUpload from './pages/VideoUpload';
import ManualCreate from './pages/ManualCreate';
import TorisetsuDetail from './pages/TorisetsuDetail';
import TorisetsuCreate from './pages/TorisetsuCreate';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/project/:id" element={<PrivateRoute><ProjectDetail /></PrivateRoute>} />
            <Route path="/torisetsu/create" element={<PrivateRoute><TorisetsuCreate /></PrivateRoute>} />
            <Route path="/torisetsu/:id" element={<PrivateRoute><TorisetsuDetail /></PrivateRoute>} />
            <Route path="/manual/:id" element={<PrivateRoute><ManualEditor /></PrivateRoute>} />
            <Route path="/manual/:id/edit" element={<PrivateRoute><ManualEditor /></PrivateRoute>} />
            <Route path="/manual/:id/playback" element={<PrivateRoute><ManualPlayback /></PrivateRoute>} />
            <Route path="/share/:shareToken" element={<SharedManualPlayback />} />
            <Route path="/record" element={<PrivateRoute><ScreenRecorder /></PrivateRoute>} />
            <Route path="/upload" element={<PrivateRoute><VideoUpload /></PrivateRoute>} />
            <Route path="/manual/create" element={<PrivateRoute><ManualCreate /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '12px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                color: '#1e293b',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: {
                style: {
                  background: 'rgba(240, 253, 244, 0.95)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  color: '#166534',
                },
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#dcfce7',
                },
              },
              error: {
                style: {
                  background: 'rgba(254, 242, 242, 0.95)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#dc2626',
                },
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fee2e2',
                },
              },
              loading: {
                style: {
                  background: 'rgba(239, 246, 255, 0.95)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  color: '#1d4ed8',
                },
                iconTheme: {
                  primary: '#3b82f6',
                  secondary: '#dbeafe',
                },
              },
            }}
          />
        </div>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;