'use client';
import { useEffect, useRef } from 'react';
import { analytics } from '@/lib/analytics';

interface Props {
  title: string;
  slug: string;
}

export default function BlogScrollTracker({ title, slug }: Props) {
  const endRef   = useRef<HTMLDivElement>(null);
  const fired50  = useRef(false);
  const fired100 = useRef(false);

  useEffect(() => {
    function onScroll() {
      if (fired50.current && fired100.current) return;
      const el = document.documentElement;
      const scrolled = el.scrollTop / (el.scrollHeight - el.clientHeight);
      if (!fired50.current && scrolled >= 0.5) {
        fired50.current = true;
        analytics.blogScroll('50', title, slug);
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !fired100.current) {
        fired100.current = true;
        analytics.blogScroll('100', title, slug);
      }
    }, { threshold: 0.1 });

    if (endRef.current) observer.observe(endRef.current);
    return () => {
      window.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, [title, slug]);

  return <div ref={endRef} aria-hidden />;
}
