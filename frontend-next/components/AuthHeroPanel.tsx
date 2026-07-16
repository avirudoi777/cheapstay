import Image from 'next/image';

export default function AuthHeroPanel() {
  return (
    <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-pro-navy">
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-pro-navy/80 via-pro-navy/20 to-transparent" />
      <Image src="/hero.jpg" alt="Travel" fill className="object-cover" priority />

      <div className="absolute top-12 left-12 z-20">
        <span className="font-headline-lg text-headline-lg text-white">CheapStay.co</span>
      </div>

      <div className="absolute bottom-12 left-12 right-12 z-20 max-w-lg">
        <div className="bg-white/10 backdrop-blur-md p-stack-md rounded-xl border border-white/20">
          <p className="text-white font-body-lg text-body-lg italic mb-4">
            &ldquo;I built CheapStay to share the pricing tricks I use on my own trips — Thai IP pricing, cashback stacking, and the right card for every booking.&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-sky-blue flex-shrink-0">
              <Image src="/avi-profile.jpg" alt="Avi" fill className="object-cover object-top" />
            </div>
            <div>
              <p className="text-white font-label-bold text-label-bold">Avi</p>
              <p className="text-sky-blue text-metadata font-metadata">Founder &amp; full-time traveler</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
