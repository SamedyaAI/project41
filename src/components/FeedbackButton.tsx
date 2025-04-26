import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { FeedbackForm } from './FeedbackForm';

export function FeedbackButton() {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowFeedback(true)}
        className="fixed bottom-4 right-4 bg-gray-900 text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
        title="Give Feedback"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="hidden sm:inline">Give Feedback</span>
      </button>

      {showFeedback && (
        <FeedbackForm
          onClose={() => setShowFeedback(false)}
          onSubmit={() => setShowFeedback(false)}
        />
      )}
    </>
  );
}