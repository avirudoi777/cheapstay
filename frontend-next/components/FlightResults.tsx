'use client';
import { useEffect, useState } from 'react';
import FlightBookingModal from '@/components/FlightBookingModal';

interface Props {
  fromCode: string;
  toCode: string;
  fromName: string;
  toName: string;
  depart: string;
  ret: string;
  onClear: () => void;
  passportCodes: string[];
}

export default function FlightResults({ fromCode, toCode, fromName, toName, depart, ret, onClear, passportCodes }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  // Auto-open the booking modal as soon as this component mounts
  useEffect(() => {
    setModalOpen(true);
  }, [fromCode, toCode, depart, ret]);

  const departLabel = new Date(depart + 'T12:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <>
      {/* Slim route context bar shown behind the modal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 mb-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>{fromName}</span>
              <span className="text-gray-300">→</span>
              <span>{toName}</span>
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {departLabel}
              {ret && <span> · Return {new Date(ret + 'T12:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
              {!ret && <span> · One way</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #1D9E75, #1A73E8)' }}>
              Search flights
            </button>
            <button onClick={onClear}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100">
              ✕ Clear
            </button>
          </div>
        </div>
      </div>

      <FlightBookingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        origin={fromCode}
        destination={toCode}
        departureDate={depart}
        returnDate={ret || undefined}
        fromName={fromName}
        toName={toName}
        passportCodes={passportCodes}
      />
    </>
  );
}
