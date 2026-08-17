type IconProps = { className?: string };

const base = "1.6";

export function IconOverview({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.4" stroke="currentColor" strokeWidth={base} />
      <rect x="11" y="2.5" width="6.5" height="9.5" rx="1.4" stroke="currentColor" strokeWidth={base} />
      <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.4" stroke="currentColor" strokeWidth={base} />
      <rect x="11" y="14" width="6.5" height="3.5" rx="1.4" stroke="currentColor" strokeWidth={base} />
    </svg>
  );
}

export function IconSales({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M3 15.5 8 9l3.5 3L17 5" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.5 5H17v4.5" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCompanyStrategy({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth={base} />
      <path d="m12.6 7.4-1.8 3.7-3.7 1.8 1.8-3.7 3.7-1.8Z" stroke="currentColor" strokeWidth={base} strokeLinejoin="round" />
    </svg>
  );
}

export function IconTimeline({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <rect x="2.5" y="4" width="15" height="13" rx="1.6" stroke="currentColor" strokeWidth={base} />
      <path d="M2.5 8h15M6.5 2.5v3M13.5 2.5v3" stroke="currentColor" strokeWidth={base} strokeLinecap="round" />
    </svg>
  );
}

export function IconProjectTimeline({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M3 5h14M3 10h9M3 15h5" stroke="currentColor" strokeWidth={base} strokeLinecap="round" />
      <circle cx="17" cy="10" r="1.4" fill="currentColor" />
      <circle cx="9" cy="15" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function IconMarketing({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M3 8v4h3.5L11 15V5L6.5 8H3Z" stroke="currentColor" strokeWidth={base} strokeLinejoin="round" />
      <path d="M14 7.5c.9.7 1.4 1.6 1.4 2.5s-.5 1.8-1.4 2.5" stroke="currentColor" strokeWidth={base} strokeLinecap="round" />
      <path d="M16.2 5.3c1.4 1.1 2.3 2.7 2.3 4.7s-.9 3.6-2.3 4.7" stroke="currentColor" strokeWidth={base} strokeLinecap="round" />
    </svg>
  );
}

export function IconLeadGen({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M3 4.5h14l-5.5 6.5V16l-3 1.5v-6.5L3 4.5Z" stroke="currentColor" strokeWidth={base} strokeLinejoin="round" />
    </svg>
  );
}

export function IconFollowUp({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth={base} />
      <path d="M10 6v4l2.8 1.6" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconGrowth({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M4 16V10M10 16V6M16 16v-4" stroke="currentColor" strokeWidth={base} strokeLinecap="round" />
      <path d="M2.5 16.5h15" stroke="currentColor" strokeWidth={base} strokeLinecap="round" />
    </svg>
  );
}

export function IconStrategies({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <rect x="3.5" y="2.5" width="13" height="15" rx="1.6" stroke="currentColor" strokeWidth={base} />
      <path d="M6.5 6.5h7M6.5 9.5h7M6.5 12.5h4" stroke="currentColor" strokeWidth={base} strokeLinecap="round" />
    </svg>
  );
}

export function IconProduction({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth={base} />
      <path
        d="M10 3v2M10 15v2M17 10h-2M5 10H3M15.1 4.9l-1.4 1.4M6.3 13.7l-1.4 1.4M15.1 15.1l-1.4-1.4M6.3 6.3 4.9 4.9"
        stroke="currentColor"
        strokeWidth={base}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconDeliverables({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M4 6.5 10 3l6 3.5v7L10 17l-6-3.5v-7Z" stroke="currentColor" strokeWidth={base} strokeLinejoin="round" />
      <path d="M4 6.5 10 10l6-3.5M10 10v7" stroke="currentColor" strokeWidth={base} strokeLinejoin="round" />
    </svg>
  );
}

export function IconClientSuccess({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth={base} />
      <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth={base} strokeLinecap="round" />
    </svg>
  );
}

export function IconFinance({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth={base} />
      <path d="M10 6.5v7M12.2 8c-.3-.8-1.1-1.3-2.2-1.3-1.3 0-2.2.7-2.2 1.6 0 2.1 4.4 1 4.4 3 0 .9-.9 1.6-2.2 1.6-1.1 0-1.9-.5-2.2-1.3" stroke="currentColor" strokeWidth={base} strokeLinecap="round" />
    </svg>
  );
}

export function IconPlus({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconClose({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function IconMenu({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function IconTrash({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M4 6h12M8 6V4.5h4V6M6 6l.7 9.5A1.5 1.5 0 0 0 8.2 17h3.6a1.5 1.5 0 0 0 1.5-1.5L14 6" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChevron({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M7.5 4.5 13 10l-5.5 5.5" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
