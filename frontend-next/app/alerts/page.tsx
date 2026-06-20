'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

type Alert = {
  id: string;
  hotel_name: string;
  destination: string;
  target_price: number;
  current_price: number | null;
  is_active: boolean;
  created_at: string;
  alert_triggered_at: string | null;
};

export default function AlertsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/auth/login'); return; }
      setUser(data.user);
      loadAlerts(data.user.id);
    });
  }, []);

  async function loadAlerts(userId: string) {
    const { data } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setAlerts(data ?? []);
    setLoading(false);
  }

  async function toggleAlert(id: string, current: boolean) {
    await supabase.from('price_alerts').update({ is_active: !current }).eq('id', id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_active: !current } : a));
  }

  async function deleteAlert(id: string) {
    await supabase.from('price_alerts').delete().eq('id', id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section style={{ background: '#0a1628' }} className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-extrabold text-white mb-1">Price Alerts</h1>
          <p className="text-white/60 text-sm">We'll notify you when a hotel hits your target price.</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {alerts.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
            <div className="text-4xl mb-4">🔔</div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">No alerts yet</h2>
            <p className="text-sm text-gray-500 mb-6">
              Search for a hotel and click &quot;Set price alert&quot; to get notified when the price drops.
            </p>
            <Link href="/"
              className="inline-block px-6 py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: '#1D9E75' }}>
              Search hotels →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map(alert => {
              const triggered = !!alert.alert_triggered_at;
              const savings = alert.current_price
                ? ((alert.current_price - alert.target_price) / alert.current_price * 100).toFixed(0)
                : null;

              return (
                <div key={alert.id}
                  className={`bg-white rounded-2xl p-5 border flex flex-col sm:flex-row gap-4 sm:items-center ${triggered ? 'border-teal' : 'border-gray-100'}`}>
                  {triggered && (
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full w-fit mb-1"
                      style={{ background: '#E1F5EE', color: '#0F6E56' }}>
                      🎉 Price hit!
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">{alert.hotel_name}</p>
                    <p className="text-xs text-gray-400">{alert.destination}</p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Target</p>
                      <p className="font-extrabold text-teal">${alert.target_price}</p>
                    </div>
                    {alert.current_price && (
                      <div className="text-center">
                        <p className="text-xs text-gray-400">Current</p>
                        <p className={`font-extrabold ${alert.current_price <= alert.target_price ? 'text-green-500' : 'text-gray-900'}`}>
                          ${alert.current_price}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleAlert(alert.id, alert.is_active)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${alert.is_active ? 'bg-teal' : 'bg-gray-200'}`}
                        style={alert.is_active ? { background: '#1D9E75' } : {}}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${alert.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                      <button onClick={() => deleteAlert(alert.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors text-xs">✕</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 p-5 rounded-2xl bg-amber-50 border border-amber-100">
          <p className="text-sm font-bold text-amber-800 mb-1">📧 Email notifications coming soon</p>
          <p className="text-xs text-amber-700">
            We're connecting email alerts now. For now, check back here to see if your price has been hit.
          </p>
        </div>
      </div>
    </main>
  );
}
