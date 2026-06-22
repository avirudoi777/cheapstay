'use client';
import { getVisaInfo, getDestinationCountry, getCountryName, flagEmoji, type VisaEntry, type VisaRequirement, type PreEntryForm } from '@/lib/visa-data';

interface Props {
  passportCodes: string[];
  city: string;
}

const PRIORITY: Record<VisaRequirement, number> = {
  visa_free: 0,
  e_visa: 1,
  visa_on_arrival: 2,
  embassy_visa: 3,
  entry_restricted: 4,
};

const CONFIG: Record<VisaRequirement, { border: string; bg: string; icon: string; label: string }> = {
  visa_free:        { border: '#1D9E75', bg: '#F0FBF7', icon: '✅', label: 'No visa needed' },
  visa_on_arrival:  { border: '#F59E0B', bg: '#FFFBEB', icon: '🛂', label: 'Visa on arrival' },
  e_visa:           { border: '#F59E0B', bg: '#FFFBEB', icon: '💻', label: 'e-Visa required' },
  embassy_visa:     { border: '#F97316', bg: '#FFF7ED', icon: '🏛️', label: 'Embassy visa required' },
  entry_restricted: { border: '#EF4444', bg: '#FEF2F2', icon: '🚫', label: 'Entry restriction' },
};

const VACCINATION_INFO: Record<string, { label: string; detail: string }> = {
  yellow_fever: {
    label: 'Yellow fever vaccine required',
    detail: 'Proof of yellow fever vaccination is required for entry. This applies to all travelers — airlines can deny boarding without a valid vaccination certificate (yellow card).',
  },
};

function OfficialLink({ destCode }: { destCode: string }) {
  const links: Record<string, string> = {
    TH: 'https://www.thaiembassy.com/thailand-visa/thai-visa-exemption',
    ID: 'https://www.imigrasi.go.id/',
    JP: 'https://www.mofa.go.jp/j_info/visit/visa/index.html',
    SG: 'https://www.ica.gov.sg/enter-transit-depart/entering-singapore',
    MY: 'https://www.imi.gov.my/',
    AE: 'https://www.uaeentry.ae/',
    VN: 'https://evisa.xuatnhapcanh.gov.vn/',
    KH: 'https://www.evisa.gov.kh/',
    IN: 'https://indianvisaonline.gov.in/',
    CN: 'https://www.visaforchina.cn/',
    KR: 'https://www.k-eta.go.kr/',
    AU: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/electronic-travel-authority-601',
    NZ: 'https://www.immigration.govt.nz/new-zealand-visas/apply-for-a-visa/tools-and-information/your-situation/nzeta',
    US: 'https://esta.cbp.dhs.gov/',
    GB: 'https://www.gov.uk/electronic-travel-authorisation',
    TR: 'https://www.evisa.gov.tr/',
    EG: 'https://visa2egypt.gov.eg/',
    JO: 'https://www.timatic.aero/home',
    CO: 'https://www.cancilleria.gov.co/tramites_servicios/visas',
    BR: 'https://www.gov.br/mre/pt-br/assuntos/viagens-internacionais',
    KE: 'https://evisa.go.ke/',
  };
  const url = links[destCode];
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="text-xs font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity"
      style={{ color: '#374151' }}>
      Check official requirements →
    </a>
  );
}

export default function VisaBanner({ passportCodes, city }: Props) {
  const destCode = getDestinationCountry(city);
  if (!destCode || passportCodes.length === 0) return null;

  // Gather results for all passports, pick most favorable
  const results = passportCodes
    .map(code => ({ code, info: getVisaInfo(code, city) }))
    .filter((r): r is { code: string; info: VisaEntry } => r.info !== null);

  if (results.length === 0) return null;

  const best = results.reduce((a, b) =>
    PRIORITY[a.info.requirement] <= PRIORITY[b.info.requirement] ? a : b
  );

  const cfg = CONFIG[best.info.requirement];
  const destName = getCountryName(destCode);
  const showPassportBadge = passportCodes.length > 1;

  return (
    <div className="rounded-2xl mb-4 overflow-hidden"
      style={{ border: `1.5px solid ${cfg.border}`, background: cfg.bg }}>
      <div className="px-4 py-3 flex items-start gap-3">
        <span className="text-xl flex-shrink-0 mt-0.5">{cfg.icon}</span>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold text-gray-900">
              {flagEmoji(destCode)} {destName} entry requirements
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: cfg.border }}>
              {cfg.label}
            </span>
            {best.info.duration && (
              <span className="text-xs text-gray-500">{best.info.duration}</span>
            )}
          </div>

          {/* Which passport is being used (dual passport case) */}
          {showPassportBadge && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-xs text-gray-500">Using</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(0,0,0,0.06)', color: '#374151' }}>
                {flagEmoji(best.code)} {getCountryName(best.code)} passport
              </span>
              {results.length > 1 && (
                <span className="text-xs text-gray-400">(best of your {passportCodes.length})</span>
              )}
            </div>
          )}

          {/* Notes */}
          {best.info.notes && (
            <p className="text-xs text-gray-600 leading-relaxed mb-2">{best.info.notes}</p>
          )}

          {/* Vaccination warnings */}
          {best.info.vaccinations && best.info.vaccinations.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {best.info.vaccinations.map(vax => {
                const v = VACCINATION_INFO[vax];
                if (!v) return null;
                return (
                  <div key={vax} className="flex items-start gap-2 px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <span className="text-sm flex-shrink-0">💉</span>
                    <div>
                      <p className="text-xs font-bold text-red-700">{v.label} may be required</p>
                      <p className="text-xs text-red-600 leading-relaxed mt-0.5">{v.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pre-entry forms */}
          {best.info.preEntryForms && best.info.preEntryForms.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {best.info.preEntryForms.map((form: PreEntryForm) => (
                <div key={form.name} className="flex items-start gap-2 px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <span className="text-sm flex-shrink-0">📋</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-blue-700">{form.name} required</p>
                    <p className="text-xs text-blue-600 mt-0.5">Complete online before departure · {form.deadline}</p>
                    <a href={form.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-semibold underline underline-offset-2 hover:opacity-70 mt-1 inline-block"
                      style={{ color: '#1D4ED8' }}>
                      Fill out form →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-2">
            <OfficialLink destCode={destCode} />
          </div>
        </div>
      </div>
    </div>
  );
}
