import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import AIForecast from '@/pages/AIForecast';
import Sustainability from '@/pages/Sustainability';
import Optimization from '@/pages/Optimization';
import LandingPage from '@/pages/LandingPage';
import AuthPage from '@/pages/AuthPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Entry point — Landing page */}
        <Route path="/landing" element={<LandingPage />} />
        
        {/* Auth */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Dashboard (protected in future) */}
        <Route path="/dashboard" element={<AppLayout />}>
          <Route index                 element={<Dashboard />}     />
          <Route path="forecast"       element={<AIForecast />}    />
          <Route path="sustainability" element={<Sustainability />} />
          <Route path="optimization"   element={<Optimization />}  />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
