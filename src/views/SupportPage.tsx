import React, { useState } from "react";
import {
  HelpCircle,
  Mail,
  MessageSquare,
  AlertCircle,
  Send,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getApiBaseUrl } from "../lib/env";

const SupportPage: React.FC = () => {
  const { user } = useAuth();

  const [email, setEmail] = useState(user?.email ?? "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const categories = [
    { id: "general", label: "General Question", icon: HelpCircle },
    { id: "bug", label: "Report a Bug", icon: AlertCircle },
    { id: "feature", label: "Feature Request", icon: MessageSquare },
    { id: "account", label: "Account Issue", icon: Mail },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !subject.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/support`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          subject: subject.trim(),
          category,
          message: message.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(
          (data as { error?: string }).error ||
            "Failed to send message. Please try again.",
        );
        return;
      }

      setSubmitted(true);
      setSubject("");
      setMessage("");
      if (!user?.email) setEmail("");
      setTimeout(() => setSubmitted(false), 6000);
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-0 py-2 sm:px-4 sm:py-6">
      <div className="mb-6 px-3 sm:mb-8 sm:px-0">
        <h1 className="text-2xl font-bold text-white sm:text-3xl mb-2">
          Support Center
        </h1>
        <p className="text-gray-400">
          Get help with your account or report issues
        </p>
      </div>

      {/* Category selector */}
      <div className="grid grid-cols-1 gap-4 px-3 sm:px-0 md:grid-cols-2 sm:gap-6 mb-6 sm:mb-8">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.id}
              className={`bg-gray-900/50 backdrop-blur-xl border rounded-2xl p-5 sm:p-6 transition-all cursor-pointer ${
                category === cat.id
                  ? "border-white/25 bg-white/[0.06]"
                  : "border-gray-800 hover:bg-gray-900/70"
              }`}
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

      {/* Contact form */}
      <div className="bg-gray-900/50 backdrop-blur-xl border-y border-gray-800 sm:border sm:rounded-2xl p-5 sm:p-8">
        <h2 className="text-xl font-semibold text-white mb-6">
          Contact Support
        </h2>

        {submitted ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Message Sent!
            </h3>
            <p className="text-gray-400">
              We'll get back to you at{" "}
              <span className="text-white">{email || "your email"}</span> soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={!!user?.email}
                className={`w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  user?.email ? "opacity-60 cursor-not-allowed" : ""
                }`}
              />
              {user?.email && (
                <p className="text-xs text-gray-500 mt-1">
                  Using your account email
                </p>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Subject <span className="text-red-400">*</span>
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

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or question in as much detail as possible..."
                rows={8}
                required
                maxLength={5000}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                {message.length}/5000
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={
                submitting ||
                !email.trim() ||
                !subject.trim() ||
                !message.trim()
              }
              className="w-full bg-white text-black py-3 rounded-xl font-semibold hover:bg-gray-100 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
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

      {/* FAQ */}
      <div className="mt-8 px-3 sm:px-0">
        <h2 className="text-xl font-semibold text-white mb-6">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {[
            {
              q: "How do I create an account?",
              a: 'Click the "Sign up" button and follow the instructions to create your account.',
            },
            {
              q: "How do I reset my password?",
              a: 'Go to the login page and click "Forgot password?" to reset your password.',
            },
            {
              q: "How do I report inappropriate content?",
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
