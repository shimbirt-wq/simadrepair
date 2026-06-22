import Link from "next/link";

const quickLinks = [
  { href: "/#home", label: "Home" },
  { href: "/#services", label: "Services" },
  { href: "/#about-us", label: "About Us" }
] as const;

const resources = [
  { href: "/#help-center", label: "Help Center" },
  { href: "/#it-policies", label: "IT Policies" },
  { href: "/#guidelines", label: "Guidelines" },
  { href: "/#announcements", label: "Announcements" },
  { href: "/#status", label: "Status Page" }
] as const;

function BrandMark() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="h-11 w-11">
      <path
        d="M32 4.5 50 14.9v20.7L32 46 14 35.6V14.9L32 4.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="3.2"
      />
      <path
        d="M32 4.5v41.5M14 14.9 32 25.3l18-10.4M14 35.6 32 25.3l18 10.3M14 14.9 32 35.6l18-20.7M14 35.6 32 14.9l18 20.7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3.2"
      />
      <path
        d="M25.2 25.4c2 2.5 4.3 3.8 6.8 3.8s4.8-1.3 6.8-3.8M25.2 25.4c2-2.5 4.3-3.8 6.8-3.8s4.8 1.3 6.8 3.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.9"
      />
      <circle cx="32" cy="25.4" r="2.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M12 21s6-4.8 6-11a6 6 0 1 0-12 0c0 6.2 6 11 6 11Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="10" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function LandingFooter() {
  return (
    <footer
      id="support"
      className="relative scroll-mt-[100px] overflow-hidden bg-[#071B3A] px-4 pb-8 pt-16 text-white sm:px-6 lg:px-8"
    >
      <div className="pointer-events-none absolute right-0 top-0 h-full w-[260px] bg-[radial-gradient(circle,_rgba(20,184,166,0.18)_1px,_transparent_1px)] bg-[length:10px_10px] opacity-40" />
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-12 md:grid-cols-2 xl:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          <div>
            <div className="flex items-start gap-4">
              <span className="text-[#5EEAD4]">
                <BrandMark />
              </span>
              <div>
                <p className="text-[30px] font-extrabold tracking-[-0.04em] text-white">
                  FarsamoTech
                </p>
                <p className="mt-1 text-[15px] font-medium text-[#9FD9D4]">
                  Campus IT Care
                </p>
              </div>
            </div>
            <p className="mt-8 max-w-[280px] text-[18px] leading-8 text-[#D6E4F1]">
              Your campus IT partner for smarter support, faster service, and better digital care.
            </p>
          </div>

          <div>
            <h3 className="text-[22px] font-bold tracking-[-0.03em] text-white">
              Quick Links
            </h3>
            <ul className="mt-7 space-y-4 text-[17px] text-[#D6E4F1]">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="transition-colors duration-200 hover:text-[#5EEAD4]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[22px] font-bold tracking-[-0.03em] text-white">
              Resources
            </h3>
            <ul className="mt-7 space-y-4 text-[17px] text-[#D6E4F1]">
              {resources.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="transition-colors duration-200 hover:text-[#5EEAD4]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[22px] font-bold tracking-[-0.03em] text-white">
              Contact Information
            </h3>
            <ul className="mt-7 space-y-5 text-[17px] leading-8 text-[#D6E4F1]">
              <li className="flex items-start gap-3">
                <span className="mt-1 text-[#5EEAD4]">
                  <LocationIcon />
                </span>
                <span>Main Campus</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-6 text-center text-[16px] text-[#C8D6E5]">
          © 2026 FarsamoTech. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
