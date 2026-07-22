'use client';
import { useEffect, useState } from 'react';

interface Props {
  timezone: string;
  lat: number;
  lng: number;
}

export default function WeatherClock({ timezone, lat, lng }: Props) {
  const [time, setTime] = useState('');
  const [weather, setWeather] = useState<{ temp: number; humidity: number } | null>(null);

  useEffect(() => {
    const tick = () => setTime(new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', timeZone: timezone }).format(new Date()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [timezone]);

  useEffect(() => {
    let cancelled = false;
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m&timezone=${encodeURIComponent(timezone)}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (cancelled || !data?.current) return;
        setWeather({ temp: Math.round(data.current.temperature_2m), humidity: Math.round(data.current.relative_humidity_2m) });
      })
      .catch(() => { /* nice-to-have, not critical path — silently omit weather on failure */ });
    return () => { cancelled = true; };
  }, [lat, lng, timezone]);

  if (!time) return null;

  return (
    <span className="text-white/80 text-sm">
      {time} local time{weather ? ` · ${weather.temp}°C · ${weather.humidity}% humidity` : ''}
    </span>
  );
}
