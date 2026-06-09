'use client';
import { useState, useEffect } from 'react';
import { getConfig, saveConfig } from '@/lib/api';

interface Props { open: boolean; onClose: () => void; }

export default function SettingsModal({ open, onClose }: Props) {
  const [agodaId, setAgodaId]       = useState('');
  const [tpToken, setTpToken]       = useState('');
  const [tpMarker, setTpMarker]     = useState('');
  const [rateCC, setRateCC]         = useState('3.0');
  const [rateAgoda, setRateAgoda]   = useState('6.0');
  const [rateHL, setRateHL]         = useState('0.0');
  const [saved, setSaved]           = useState(false);
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    if (!open) return;
    getConfig().then(cfg => {
      if (!cfg) return;
      setAgodaId(cfg.agoda_affiliate_id ?? '');
      setTpToken(cfg.travelpayouts_token ?? '');
      setTpMarker(cfg.travelpayouts_marker ?? '');
      setRateCC(((cfg.credit_card_rate ?? 0.03) * 100).toFixed(1));
      setRateAgoda(((cfg.sites?.agoda?.rate ?? 0.06) * 100).toFixed(1));
      setRateHL(((cfg.sites?.hotellook?.rate ?? 0) * 100).toFixed(1));
    });
  }, [open]);

  async function handleSave() {
    setSaving(true);
    const ok = await saveConfig({
      agoda_affiliate_id: agodaId,
      travelpayouts_token: tpToken,
      travelpayouts_marker: tpMarker,
      credit_card_rate: parseFloat(rateCC) / 100,
      sites: {
        agoda:     { rate: parseFloat(rateAgoda) / 100 },
        hotellook: { rate: parseFloat(rateHL) / 100 },
      },
    });
    setSaving(false);
    if (ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-navy">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-navy transition-colors text-xl leading-none">✕</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6 overflow-y-auto max-h-[70vh]">
          <p className="text-xs text-gray-400">Affiliate IDs, API tokens, and cashback rates. Saved to your local config.</p>

          {/* Agoda */}
          <div>
            <div className="text-xs font-bold text-navy uppercase tracking-wider mb-3">Agoda</div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">Affiliate ID <span className="text-gray-400">— from partner.agoda.com</span></label>
                <input value={agodaId} onChange={e => setAgodaId(e.target.value)}
                  placeholder="e.g. 1234567" className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Cashback rate % <span className="text-gray-400">— TopCashBack</span></label>
                <input type="number" value={rateAgoda} onChange={e => setRateAgoda(e.target.value)}
                  step="0.1" min="0" max="50" className="mt-1 w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
              </div>
            </div>
          </div>

          {/* Travelpayouts */}
          <div>
            <div className="text-xs font-bold text-navy uppercase tracking-wider mb-3">Travelpayouts · Hotellook</div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">API Token</label>
                <input value={tpToken} onChange={e => setTpToken(e.target.value)}
                  placeholder="e.g. abc123def456" className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Marker <span className="text-gray-400">— affiliate marker</span></label>
                <input value={tpMarker} onChange={e => setTpMarker(e.target.value)}
                  placeholder="e.g. 537802" className="mt-1 w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Cashback rate % <span className="text-gray-400">— Travelpayouts</span></label>
                <input type="number" value={rateHL} onChange={e => setRateHL(e.target.value)}
                  step="0.1" min="0" max="50" className="mt-1 w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
              </div>
            </div>
          </div>

          {/* Credit card */}
          <div>
            <div className="text-xs font-bold text-navy uppercase tracking-wider mb-3">Credit Card</div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Cashback rate %</label>
              <input type="number" value={rateCC} onChange={e => setRateCC(e.target.value)}
                step="0.1" min="0" max="10" className="mt-1 w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          {saved ? (
            <span className="text-sm text-teal font-semibold">✓ Saved!</span>
          ) : <span />}
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2.5 bg-navy hover:bg-navy-light disabled:bg-gray-300 text-white text-sm font-bold rounded-xl transition-colors">
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
