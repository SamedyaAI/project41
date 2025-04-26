import { Routes, Route, Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import HomePage from './pages/HomePage';
import { FeedbackList } from './components/FeedbackList';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/feedback" element={<FeedbackList />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>

      <Link
        to="/feedback"
        className="fixed bottom-4 right-4 bg-gray-900 text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="hidden sm:inline">View Feedback</span>
      </Link>
    </>
  );
}

export default App;