import { BatteryCharging, ClipboardCheck, HardDrive, IdCard, KeyRound, Laptop, PackageCheck, ShieldCheck, Wifi, Wrench, X } from "lucide-react";
import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui";

export function HomeSection({ id, eyebrow, title, children, tone = "plain" }: { id: string; eyebrow: string; title: string; children: ReactNode; tone?: "plain" | "muted" }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={tone === "muted" ? "border-y border-line bg-surface" : undefined}>
      <div className="mx-auto flex max-w-content flex-col gap-8 px-4 py-14 sm:px-6 sm:py-20">
        <div className="flex max-w-2xl flex-col gap-2">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 id={`${id}-title`} className="text-h1 text-ink">
            {title}
          </h2>
        </div>
        {children}
      </div>
    </section>
  );
}

const icon = { className: "h-5 w-5", strokeWidth: 1.75, "aria-hidden": true } as const;

export function HowItWorks() {
  const steps = [
    { icon: <ClipboardCheck {...icon} />, title: "Register online", body: "Tell us about the device and the problem. You get a tracking code." },
    { icon: <Laptop {...icon} />, title: "Drop it off", body: "Bring the device to the desk at the venue during the event." },
    { icon: <Wrench {...icon} />, title: "We repair it", body: "Follow the status with your code. Your technician's WhatsApp is on the tracking page." },
    { icon: <PackageCheck {...icon} />, title: "Collect it", body: "We message you when it's ready. Bring your university ID card." },
  ];
  return (
    <HomeSection id="how" eyebrow="How it works" title="Four steps, one tracking code">
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <li key={step.title} className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-soft text-accent">{step.icon}</span>
              <span className="font-mono text-caption text-ink-muted">0{index + 1}</span>
            </div>
            <h3 className="text-h3 text-ink">{step.title}</h3>
            <p className="text-small text-ink-secondary">{step.body}</p>
          </li>
        ))}
      </ol>
    </HomeSection>
  );
}

export function BeforeYouCome() {
  const items = [
    { icon: <ShieldCheck {...icon} />, title: "Back up your files", body: "Copy anything important first if you can. If not, we can help at the desk." },
    { icon: <BatteryCharging {...icon} />, title: "Bring the charger", body: "We need it to test the device." },
    { icon: <IdCard {...icon} />, title: "Bring your university ID card", body: "We check it at drop-off and at pickup." },
    { icon: <KeyRound {...icon} />, title: "Know your password", body: "Technicians may need to sign in. It's stored encrypted and deleted at pickup." },
  ];
  return (
    <HomeSection id="before" eyebrow="Before you come" title="Bring the right things">
      <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.title} className="flex gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-line bg-app text-accent">{item.icon}</span>
            <div className="flex flex-col gap-1">
              <h3 className="text-body font-semibold text-ink">{item.title}</h3>
              <p className="text-small text-ink-secondary">{item.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </HomeSection>
  );
}

export function WhatWeFix() {
  // The five services on the official programme poster.
  const fix = [
    { icon: <Wrench {...icon} />, label: "Hardware check and cleaning" },
    { icon: <Laptop {...icon} />, label: "Windows installation and software updates" },
    { icon: <ShieldCheck {...icon} />, label: "Virus and malware scanning" },
    { icon: <HardDrive {...icon} />, label: "Data backup assistance" },
    { icon: <Wifi {...icon} />, label: "Network connectivity testing" },
  ];
  const dont = [
    "Pirated or cracked software: we install free or university-licensed software only",
    "Buying parts: if a part is needed, we tell you exactly what to buy",
    "Promising your files survive a failing drive",
  ];
  return (
    <HomeSection id="fix" eyebrow="What we do" title="A free tune-up for your laptop" tone="muted">
      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-4">
          <ul className="grid gap-3 sm:grid-cols-2">
            {fix.map((item) => (
              <li key={item.label} className="flex items-center gap-3 rounded-md border border-line bg-surface px-4 py-3 text-small font-medium text-ink">
                <span className="text-accent">{item.icon}</span>
                {item.label}
              </li>
            ))}
          </ul>
          <p className="text-small text-ink-secondary">We also look at devices that won&apos;t turn on, screens, keyboards, batteries and charging.</p>
        </div>
        <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5">
          <h3 className="text-h3 text-ink">What we don&apos;t do</h3>
          <ul className="flex flex-col gap-2.5">
            {dont.map((item) => (
              <li key={item} className="flex gap-2.5 text-small text-ink-secondary">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" strokeWidth={2} aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </HomeSection>
  );
}

export function Faq({ holdDays }: { holdDays: number }) {
  const items = [
    { q: "Is it free?", a: "Yes. The repair and maintenance work is free for SIMAD students and staff. If a part must be replaced, such as a battery, screen or keyboard, we tell you exactly what to buy and fit it for you." },
    { q: "How long does a repair take?", a: "Most devices are done during the event. Track the status any time with your code. We message you on WhatsApp when it's ready." },
    { q: "I lost my tracking code", a: "Use Find my request with your university ID and the last 4 digits of your phone number." },
    { q: "Can someone else collect my device?", a: "Yes. Anyone carrying your university ID card can collect it. We record the name and phone number of whoever collects." },
    { q: "What about my files and privacy?", a: "Back up what you can before you come; we can help with backup at the desk. We only reinstall Windows if you allowed it on the form. Device passwords are stored encrypted and deleted at pickup, and personal details are erased 12 months after the event." },
    { q: "What if I can't collect during the event?", a: `Uncollected devices move to the IT office after the event. Collect yours there within ${holdDays} days with your university ID card.` },
  ];
  return (
    <HomeSection id="faq" eyebrow="Questions" title="Good to know">
      <div className="flex max-w-3xl flex-col divide-y divide-line rounded-lg border border-line bg-app">
        {items.map((item) => (
          <details key={item.q} className="group px-5 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-body font-semibold text-ink focus-visible:outline-none focus-visible:shadow-focus">
              {item.q}
              <span className="text-ink-muted transition-transform duration-base group-open:rotate-45" aria-hidden>
                +
              </span>
            </summary>
            <p className="pb-5 text-body text-ink-secondary">{item.a}</p>
          </details>
        ))}
      </div>
    </HomeSection>
  );
}
