import Link from 'next/link';
import type { Metadata } from 'next';
import { AppFooter } from '@/components/AppFooter';
import { LinkButton } from '@/components/ui';

export const metadata: Metadata = {
  title: 'DocuBot — A chatbot that already knows your documents',
  description:
    'Upload your files and in minutes you have a chatbot that answers your visitors with your own documents\' real content.',
};

const LOGOS = ['Nortia', 'Caleta Studio', 'Vento', 'Marca Sur', 'Puente Legal'];

const STEPS = [
  {
    number: '1',
    title: 'Upload your documents',
    body: 'DocuBot reads your files and folders on its own: it extracts their text and understands what each document says.',
  },
  {
    number: '2',
    title: 'The chatbot is built',
    body: 'In minutes you have an assistant that knows your content by heart, without you writing a single line of configuration.',
  },
  {
    number: '3',
    title: 'Paste it on your site',
    body: 'A script tag and the chat appears, with your color and your greeting. It starts answering your visitors instantly, using only your documents.',
  },
];

const OUTCOMES = [
  {
    icon: <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />,
    title: 'Answers faithful to your documents',
    body: 'The chat only says what your documents say, and always names the exact file the answer came from. If it doesn\'t know, it says so instead of making things up.',
  },
  {
    icon: <path d="M21 12a9 9 0 1 1-3-6.7M21 3v6h-6" />,
    title: 'Always up to date',
    body: 'Upload new or changed files any time and the bot updates itself, without you touching anything else.',
  },
  {
    icon: <path d="M12 3a4 4 0 0 1 4 4c0 2-1.4 2.9-2.2 3.8-.6.7-.8 1.3-.8 2.2M12 17.5v.5" />,
    title: 'With your voice',
    body: 'Choose the tone: formal or casual, brief or detailed. The bot speaks the way you want your brand to speak.',
  },
  {
    icon: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
    title: 'Understand your visitors',
    body: 'See what they ask, which answers didn\'t work, and what your users rated, all from one simple panel.',
  },
];

const STATS = [
  { value: '92%', label: 'of questions answered without human intervention' },
  { value: '<3 min', label: 'to go from your documents to a working chat' },
  { value: '0', label: 'lines of configuration required' },
  { value: '24/7', label: 'availability once your documents are indexed' },
];

const PLANS = [
  {
    name: 'Free',
    tagline: 'To try it with no commitment',
    price: '$0',
    cta: 'Get started',
    variant: 'secondary' as const,
    features: ['50 indexed documents', '200 messages / month', 'DocuBot branding'],
  },
  {
    name: 'Pro',
    tagline: 'For a site in production',
    price: '$29',
    period: '/ month',
    cta: 'Start 14-day trial',
    variant: 'primary' as const,
    featured: true,
    features: [
      '2,000 indexed documents',
      '5,000 messages / month',
      'Unlimited re-uploads',
      'No DocuBot branding',
    ],
  },
  {
    name: 'Enterprise',
    tagline: 'For multiple sites and brands',
    price: 'Custom',
    cta: 'Talk to sales',
    variant: 'secondary' as const,
    features: ['Unlimited collections', 'SSO and team roles', 'Priority support'],
  },
];

function Check({ className = 'text-emerald-600' }: { className?: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`mt-0.5 shrink-0 ${className}`}
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-accent/10 text-accent">
      <svg
        viewBox="0 0 24 24"
        width="21"
        height="21"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </span>
  );
}

export default function LandingPage() {
  return (
    <div className="space-y-28 pb-4 sm:space-y-36">
      {/*
        Full-bleed: breaks out of the <main>'s max-w-5xl to reach the edges.
        50vw includes the scrollbar, so this overshoots by a few pixels;
        the <body>'s overflow-x-hidden (globals.css) clips it without
        causing horizontal scroll to appear.
      */}
      <section className="relative -mx-6 -mt-10 overflow-hidden bg-inverse px-6 pb-16 pt-16 text-content-inverse sm:mx-[calc(50%-50vw)] sm:px-[max(1.5rem,calc(50vw-32rem))] sm:pb-24 sm:pt-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(55% 55% at 15% 10%, rgba(5,150,105,0.28), transparent 70%), radial-gradient(45% 45% at 90% 85%, rgba(5,150,105,0.14), transparent 70%)',
          }}
        />

        <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-14 lg:flex-row lg:items-center lg:gap-16">
          <div className="flex max-w-xl flex-col items-start text-left">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              New: folder uploads
            </p>
            <h1 className="t-display mt-6 text-4xl leading-[1.05] text-content-inverse min-[420px]:text-5xl sm:text-6xl">
              A chatbot that already knows{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-accent">
                your documents
              </span>
            </h1>
            <p className="mt-6 text-lg text-white/70 text-pretty sm:text-xl">
              Upload your files or a whole folder. In a few minutes you have a chat
              that answers your visitors with your own content.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-5">
              <LinkButton href="/register" variant="inverse" size="lg">
                Create my free bot →
              </LinkButton>
              <Link
                href="/login"
                className="text-sm text-white/70 underline underline-offset-4 hover:text-white"
              >
                I already have an account
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/50">
              <span className="inline-flex items-center gap-1.5"><Check className="text-emerald-400" />Nothing to install</span>
              <span className="inline-flex items-center gap-1.5"><Check className="text-emerald-400" />One line of code</span>
              <span className="inline-flex items-center gap-1.5"><Check className="text-emerald-400" />Ready in minutes</span>
            </div>
          </div>

          {/* Chat mockup */}
          <div className="w-full max-w-sm shrink-0 overflow-hidden rounded-card border border-white/10 bg-surface text-content shadow-2xl">
            <div className="flex items-center gap-2.5 bg-inverse px-4 py-3.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M8 9h8M8 13h5" />
                  <path d="M21 11.5a8.5 8.5 0 0 1-13.4 6.9L3 20l1.7-4.5A8.5 8.5 0 1 1 21 11.5Z" />
                </svg>
              </span>
              <span className="text-sm font-semibold text-content-inverse">Store Assistant</span>
            </div>
            <div className="flex flex-col gap-3 bg-elevated p-4">
              <div className="max-w-[80%] self-end rounded-2xl rounded-br-sm bg-accent px-3.5 py-2.5 text-sm text-white">
                Do you ship to Springfield?
              </div>
              <div className="max-w-[88%] self-start rounded-2xl rounded-bl-sm border border-line bg-surface px-3.5 py-2.5 text-sm text-content">
                Yes — we ship nationwide, 3 to 5 business days.
                <div className="mt-2 flex items-center gap-1.5 border-t border-line-subtle pt-2 text-[11px] font-semibold text-accent">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
                  </svg>
                  Source: /shipping-and-delivery
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ LOGOS ============ */}
      <section>
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-content-muted">
          Already used by teams handling thousands of visits a month
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 opacity-50">
          {LOGOS.map((name) => (
            <span key={name} className="t-display text-xl text-content">
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="como-funciona">
        <div className="mx-auto max-w-2xl text-center">
          <p className="t-eyebrow text-accent">How it works</p>
          <h2 className="t-display mt-3 text-3xl text-content sm:text-4xl">
            From your documents to a working chatbot, in three steps
          </h2>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number} className="flex flex-col gap-4 rounded-card border border-line bg-surface p-7">
              <span className="flex h-10 w-10 items-center justify-center rounded-control bg-inverse font-serif text-base font-semibold text-content-inverse">
                {step.number}
              </span>
              <h3 className="text-lg font-semibold text-content">{step.title}</h3>
              <p className="text-sm leading-relaxed text-content-secondary text-pretty">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="producto">
        <div className="max-w-2xl">
          <p className="t-eyebrow text-accent">What you get</p>
          <h2 className="t-display mt-3 text-3xl text-content sm:text-4xl">
            A chat that knows your documents better than anyone
          </h2>
          <p className="mt-4 text-lg text-content-secondary text-pretty">
            Your visitors ask what they're looking for and get an answer
            based on your own documents, with the source file in plain sight.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {OUTCOMES.map((item) => (
            <div key={item.title} className="flex flex-col gap-3 rounded-card border border-line bg-surface p-7">
              <Icon>{item.icon}</Icon>
              <h3 className="font-semibold text-content">{item.title}</h3>
              <p className="text-sm leading-relaxed text-content-secondary text-pretty">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="-mx-6 bg-inverse px-6 py-14 text-content-inverse sm:mx-[calc(50%-50vw)] sm:px-[max(1.5rem,calc(50vw-32rem))]">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-y-10 sm:grid-cols-4 sm:gap-x-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1.5">
              <span className="t-display text-4xl text-content-inverse">{stat.value}</span>
              <span className="text-sm text-white/60">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ============ TESTIMONIAL ============ */}
      <section>
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <svg width="30" height="23" viewBox="0 0 34 26" className="fill-accent/15" aria-hidden="true">
            <path d="M0 26V15.6C0 6.9 5.3 1.2 14.2 0l1.6 4.4C10.5 5.8 7.6 9 7.6 13.3h6.8V26H0Zm19.4 0V15.6c0-8.7 5.3-14.4 14.2-15.6l1.6 4.4c-5.3 1.4-8.2 4.6-8.2 8.9h6.8V26H19.4Z" />
          </svg>
          <p className="t-display mt-6 text-2xl text-content leading-relaxed sm:text-[28px]">
            "We pasted it in on a Friday afternoon. By Monday it was already answering
            80% of shipping and returns questions, without anyone touching
            a single setting."
          </p>
          <div className="mt-7 flex items-center gap-3">
            <div className="h-11 w-11 rounded-full border border-line bg-elevated" />
            <div className="text-left">
              <div className="text-sm font-semibold text-content">Marina Sosa</div>
              <div className="text-xs text-content-muted">Growth, Caleta Studio</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="precios">
        <div className="mx-auto max-w-xl text-center">
          <p className="t-eyebrow text-accent">Pricing</p>
          <h2 className="t-display mt-3 text-3xl text-content sm:text-4xl">Simple, the way it should be</h2>
          <p className="mt-4 text-base text-content-secondary">
            Start for free. Upgrade only when your collection needs it.
          </p>
        </div>

        <div className="mt-14 grid items-stretch gap-6 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.featured
                  ? 'relative flex flex-col gap-5 rounded-card bg-inverse p-8 text-content-inverse shadow-xl'
                  : 'flex flex-col gap-5 rounded-card border border-line bg-surface p-8'
              }
            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3.5 py-1 text-xs font-bold tracking-wide text-white">
                  MOST POPULAR
                </span>
              )}
              <div>
                <h3 className={`text-base font-bold ${plan.featured ? 'text-content-inverse' : 'text-content'}`}>
                  {plan.name}
                </h3>
                <p className={`mt-1 text-sm ${plan.featured ? 'text-white/60' : 'text-content-muted'}`}>
                  {plan.tagline}
                </p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className={`t-display text-4xl ${plan.featured ? 'text-content-inverse' : 'text-content'}`}>
                  {plan.price}
                </span>
                {plan.period && (
                  <span className={`text-sm ${plan.featured ? 'text-white/60' : 'text-content-muted'}`}>
                    {plan.period}
                  </span>
                )}
              </div>
              <LinkButton href="/register" variant={plan.featured ? 'primary' : 'secondary'} className="w-full">
                {plan.cta}
              </LinkButton>
              <div className={`h-px ${plan.featured ? 'bg-white/10' : 'bg-line-subtle'}`} />
              <ul className={`flex flex-col gap-3 text-sm ${plan.featured ? 'text-white/80' : 'text-content-secondary'}`}>
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check className={plan.featured ? 'text-emerald-300' : 'text-emerald-600'} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="relative overflow-hidden rounded-card bg-inverse px-6 py-16 text-center text-content-inverse sm:px-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(60% 60% at 15% 15%, rgba(5,150,105,0.3), transparent 65%)',
          }}
        />
        <div className="relative">
          <h2 className="t-display mx-auto max-w-2xl text-3xl text-content-inverse leading-tight sm:text-4xl">
            Your documents already have all the answers. They just need a chat to give them.
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
            <LinkButton href="/register" variant="inverse" size="lg">
              Create my free bot →
            </LinkButton>
            <Link
              href="/login"
              className="text-sm text-white/70 underline underline-offset-4 hover:text-white"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
