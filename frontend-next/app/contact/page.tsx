'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent]       = useState(false);
  const [sending, setSending] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    // Opens native mail client with pre-filled content as fallback
    const body = encodeURIComponent(`Name: ${name}\n\n${message}`);
    const mailUrl = `mailto:support@cheapstay.co?subject=${encodeURIComponent(subject)}&body=${body}`;
    window.location.href = mailUrl;
    setSending(false);
    setSent(true);
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, var(--color-pro-navy), var(--color-primary))' }}>
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.75L2.25 6.75" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-navy mb-2">Get in touch</h1>
        <p className="text-gray-500 text-sm">Questions, feedback, or partnership enquiries — we read every message.</p>
      </div>

      {sent ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">✉️</div>
          <h2 className="text-xl font-bold text-navy mb-2">Thanks for reaching out!</h2>
          <p className="text-gray-500 text-sm mb-6">Your email client should have opened with your message pre-filled. Hit send and we&apos;ll get back to you within 1–2 business days.</p>
          <Link href="/" className="text-teal font-semibold text-sm hover:underline">← Back to search</Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Your name</label>
                <input value={name} onChange={e => setName(e.target.value)} required placeholder="Avi"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Subject</label>
              <select value={subject} onChange={e => setSubject(e.target.value)} required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal bg-white">
                <option value="">Select a topic…</option>
                <option value="General question">General question</option>
                <option value="Bug report">Bug report</option>
                <option value="Feature request">Feature request</option>
                <option value="Partnership / affiliate">Partnership / affiliate</option>
                <option value="Privacy / data request">Privacy / data request</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Message</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={5}
                placeholder="Tell us what's on your mind…"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal resize-none" />
            </div>

            <button type="submit" disabled={sending}
              className="w-full py-3 rounded-xl font-bold text-white text-sm transition-opacity disabled:opacity-60"
              style={{ background: 'var(--color-primary)' }}>
              Send message
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            Or email us directly at{' '}
            <a href="mailto:support@cheapstay.co" className="text-teal hover:underline">support@cheapstay.co</a>
          </p>
        </div>
      )}
    </div>
  );
}
