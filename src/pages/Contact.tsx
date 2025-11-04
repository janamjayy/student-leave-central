import React, { useState, useEffect } from 'react';

const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [message, setMessage] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent('Student Leave Central – Demo Request');
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nInstitution: ${institution}\n\nMessage:\n${message}`
    );
    // Replace with your preferred email; placeholder below
    const to = 'demo@example.com';
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950 text-slate-900 dark:text-slate-100 transition-all duration-500 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-60">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-300/30 to-indigo-300/20 dark:from-blue-600/20 dark:to-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-300/30 to-pink-300/20 dark:from-purple-600/20 dark:to-pink-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <main className="flex items-center justify-center flex-1 px-4 relative z-10">
        <div className="w-full max-w-2xl">
          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 md:p-8 border border-slate-200 dark:border-slate-700/50">
            <h1 className="text-2xl md:text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">Request a Demo</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Tell us a bit about your institution and we’ll get in touch to schedule a quick walkthrough.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-lg h-11 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Work Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg h-11 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Institution</label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  required
                  className="w-full rounded-lg h-11 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Share any specific needs, timelines, or questions."
                  className="w-full rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-colors"
                >
                  Send Request
                </button>
              </div>
            </form>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-4">
              Submitting opens your default email client with a pre-filled message. Replace the email address in code with your official demo inbox when ready.
            </p>
          </div>
          <div className="mt-6 text-center text-xs text-slate-600 dark:text-slate-400">
            © {new Date().getFullYear()} Leave Management System. All rights reserved.
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;
