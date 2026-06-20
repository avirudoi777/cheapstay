'use client';
import { getVisaInfo, getDestinationCountry, getCountryName, flagEmoji, type VisaEntry, type VisaRequirement } from '@/lib/visa-data';

interface Props {
  passportCode: string;
  city: string;
}

const CONFIG: Record<VisaRequirement, { border: string; bg: string; icon: string; label: string }> = {
  visa_free:       { border: '#1D9E75', bg: '#F0FBF7', icon: '✅', label: 'No visa needed' },
  visa_on_arrival: { border: '#F59E0B', bg: '#FFFBEB', icon: '🛂', label: 'Visa on arrival' },
  e_visa:          { border: '#F59E0B', bg: '#FFFBEB', icon: '💻', label: 'e-Visa required' },
  embassy_visa:    { border: '#F97316', bg: '#FFF7ED', icon: '🏛️', label: 'Embassy visa required' },
  entry_restricted:{ border: '#EF4444', bg: '#FEF2F2', icon: '🚫', label: 'Entry restriction' },
};

const VACCINATION_INFO: Record<string, { label: string; detail: string }> = {
  yellow_fever: {
    label: 'Yellow fever vaccine',
    detail: 'Required if you are arriving from a country where yellow fever is endemic (e.g. Brazil, certain African countries). Airlines can deny boarding without proof of vaccination.',
  },
};

function OfficialLink({ destCode }: { destCode: string }) {
  const links: Record<string, string> = {
    TH: 'https://www.thaiembassy.com/thailand-visa/thai-visa-exemption',
    ID: 'https://molina.imigrasi.go.id/',
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

export default function VisaBanner({ passportCode, city }: Props) {
  const info: VisaEntry | null = getVisaInfo(passportCode, city);
  const destCode = getDestinationCountry(city);
  if (!info || !destCode) return null;

  const cfg = CONFIG[info.requirement];
  const passportName = getCountryName(passportCode);
  const destName = getCountryName(destCode);

  return (
    <div className="rounded-2xl mb-4 overflow-hidden"
      style={{ border: `1.5px solid ${cfg.border}`, background: cfg.bg }}>
      <div className="px-4 py-3 flex items-start gap-3">
        {/* Icon */}
        <span className="text-xl flex-shrink-0 mt-0.5">{cfg.icon}</span>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold text-gray-900">
              {flagEmoji(passportCode)} {passportName} → {flagEmoji(destCode)} {destName}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: cfg.border, color: '#fff' }}>
              {cfg.label}
            </span>
            {info.duration && (
              <span className="text-xs text-gray-500">{info.duration}</span>
            )}
          </div>

          {/* Notes */}
          {info.notes && (
            <p className="text-xs text-gray-600 leading-relaxed mb-2">{info.notes}</p>
          )}

          {/* Vaccination warnings */}
          {info.vaccinations && info.vaccinations.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {info.vaccinations.map(vax => {
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

          {/* Official link */}
          <div className="mt-2">
            <OfficialLink destCode={destCode} />
          </div>
        </div>
      </div>
    </div>
  );
}
