import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';
import Auth from '@/pages/Auth';
import CropAnalysis from '@/pages/CropAnalysis';
import Weather from '@/pages/Weather';
import Irrigation from '@/pages/Irrigation';
import Marketplace from '@/pages/Marketplace';
import AdminPanel from '@/pages/AdminPanel';
import Profile from '@/pages/Profile';
import Chatbot from '@/components/Chatbot';
import { FeedbackDialog } from '@/components/FeedbackDialog';

export default function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-black">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/crop-analysis" element={<CropAnalysis />} />
            <Route path="/weather" element={<Weather />} />
            <Route path="/irrigation" element={<Irrigation />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
        <Chatbot />
        <FeedbackDialog />
        <Toaster position="top-right" theme="dark" />
      </div>
    </Router>
  );
}
