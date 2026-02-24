// Support page with Apple design philosophy
import React, { useState } from 'react';
import { HelpCircle, Mail, MessageSquare, Book, AlertCircle, Send, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SupportPage: React.FC = () => {
  const { isAuthenticated, userProfile } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    { id: 'general', label: 'General Question', icon: HelpCircle },
    { id: 'bug', label: 'Report a Bug', icon: AlertCircle },
    { id: 'feature', label: 'Feature Request', icon: MessageSquare },
    { id: 'account', label: 'Account Issue', icon: Mail },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setSubmitting(true);
    // TODO: Implement support ticket submission
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setSubject('');
      setMessage('');
      setTimeout(() => setSubmitted(false), 5000);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Support Center</h1>
        <p className="text-gray-400">Get help with your account or report issues</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.id}
              className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 hover:bg-gray-900/70 transition-all cursor-pointer"
              onClick={() => setCategory(cat.id)}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center">
                  <Icon className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{cat.label}</h3>
                  <p className="text-sm text-gray-400">Get assistance</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8">
        <h2 className="text-xl font-semibold text-white mb-6">Contact Support</h2>

        {submitted ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Message Sent!</h3>
            <p className="text-gray-400">We'll get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What can we help you with?"
                required
                maxLength={200}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or question..."
                rows={8}
                required
                maxLength={5000}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                {message.length}/5000
              </p>
            </div>

            {!isAuthenticated && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <p className="text-yellow-400 text-sm">
                  Please sign in to submit a support request
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={!isAuthenticated || submitting || !subject.trim() || !message.trim()}
              className="w-full bg-white text-black py-3 rounded-xl font-semibold hover:bg-gray-100 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* FAQ Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-white mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            {
              q: 'How do I create an account?',
              a: 'Click the "Sign up" button and follow the instructions to create your account.',
            },
            {
              q: 'How do I reset my password?',
              a: 'Go to the login page and click "Forgot password?" to reset your password.',
            },
            {
              q: 'How do I report inappropriate content?',
              a: 'Click the three dots menu on any post and select "Report" to flag content.',
            },
          ].map((faq, i) => (
            <div
              key={i}
              className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-xl p-6"
            >
              <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
              <p className="text-gray-400 text-sm">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
