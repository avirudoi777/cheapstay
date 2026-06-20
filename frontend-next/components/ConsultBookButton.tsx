'use client';
import { analytics } from '@/lib/analytics';

interface Props {
  location: 'hero' | 'cta_bottom';
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export default function ConsultBookButton({ location, className, style, children }: Props) {
  return (
    <a
      href="https://cal.com/avi-rudoi-gerpc4/travel-planning-call-with-avi"
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => analytics.consultBookClick(location)}
      className={className}
      style={style}
    >
      {children}
    </a>
  );
}
