type P = { size?: number; className?: string };

export function Spark({ size = 13, className }: P) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2c.5 5.6 4.4 9.5 10 10-5.6.5-9.5 4.4-10 10-.5-5.6-4.4-9.5-10-10 5.6-.5 9.5-4.4 10-10Z" />
      <path d="M19 1c.2 2 1.6 3.4 3.6 3.6-2 .2-3.4 1.6-3.6 3.6-.2-2-1.6-3.4-3.6-3.6 2-.2 3.4-1.6 3.6-3.6Z" opacity=".7" />
    </svg>
  );
}

export function GitHub({ size = 16 }: P) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.7.5.7 5.5.7 11.8c0 5 3.2 9.2 7.7 10.7.6.1.8-.2.8-.5v-2c-3.1.7-3.8-1.3-3.8-1.3-.5-1.3-1.2-1.7-1.2-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 1.7 2.6 1.2 3.3.9.1-.7.4-1.2.7-1.5-2.5-.3-5.1-1.3-5.1-5.6 0-1.2.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3 0 0 .9-.3 3.1 1.2a10.8 10.8 0 0 1 5.6 0c2.2-1.5 3.1-1.2 3.1-1.2.6 1.5.2 2.7.1 3 .8.8 1.2 1.9 1.2 3.1 0 4.3-2.6 5.3-5.1 5.6.4.3.8 1 .8 2.1v3.1c0 .3.2.6.8.5 4.5-1.5 7.7-5.7 7.7-10.7C23.3 5.5 18.3.5 12 .5z" />
    </svg>
  );
}

export function LinkedIn({ size = 16 }: P) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2zM8 19H5v-9h3zM6.5 8.3A1.8 1.8 0 1 1 8.3 6.5a1.8 1.8 0 0 1-1.8 1.8zM19 19h-3v-4.7c0-1.4-.6-2.1-1.6-2.1-1.1 0-1.9.8-1.9 2.1V19h-3v-9h2.9v1.3a3.4 3.4 0 0 1 3-1.6c2.1 0 3.6 1.3 3.6 4z" />
    </svg>
  );
}

export function Mail({ size = 16 }: P) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

export function Gamepad({ size = 18 }: P) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 12h4M8 10v4" />
      <path d="M15 13h.01M18 11h.01" />
      <path d="M17.3 5H6.7a4.7 4.7 0 0 0-4.6 3.9l-1 6.2A3 3 0 0 0 4 18.6c.9 0 1.7-.4 2.3-1L8 15.9h8l1.7 1.7c.6.6 1.4 1 2.3 1a3 3 0 0 0 2.9-3.5l-1-6.2A4.7 4.7 0 0 0 17.3 5z" />
    </svg>
  );
}

export function Medal() {
  return (
    <svg width="17" height="17" viewBox="0 0 16 16" aria-hidden="true" focusable="false" style={{ color: "var(--gold)" }}>
      <path d="M4.3 1h2.3l2.4 5.4H6.7z" fill="currentColor" opacity=".5" />
      <path d="M9.4 1h2.3L9.3 6.4H7z" fill="currentColor" opacity=".5" />
      <circle cx="8" cy="10.9" r="4.3" fill="currentColor" />
      <circle cx="8" cy="10.9" r="2" fill="var(--bg)" opacity=".35" />
    </svg>
  );
}

export function FlagUAE() {
  return (
    <svg width="22" height="15" viewBox="0 0 28 19" aria-hidden="true" focusable="false">
      <rect width="7" height="19" fill="#FF0000" />
      <rect x="7" width="21" height="6.34" fill="#00732F" />
      <rect x="7" y="6.34" width="21" height="6.33" fill="#FFFFFF" />
      <rect x="7" y="12.67" width="21" height="6.33" fill="#000000" />
      <rect width="28" height="19" fill="none" stroke="var(--rule)" strokeWidth="1" />
    </svg>
  );
}

export function Mic() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" focusable="false" style={{ color: "var(--ink)" }}>
      <rect x="6" y="1" width="4" height="8" rx="2" fill="currentColor" />
      <path d="M4 7.5a4 4 0 0 0 8 0" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 11.5V15M5.5 15h5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function People() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" focusable="false" style={{ color: "var(--ink)" }}>
      <circle cx="5.5" cy="5" r="2.4" fill="currentColor" />
      <circle cx="11.5" cy="5.5" r="2" fill="currentColor" opacity=".55" />
      <path d="M1 14c0-2.6 2-4.4 4.5-4.4S10 11.4 10 14z" fill="currentColor" />
      <path d="M10.6 14c0-1.9-.7-3.3-1.8-4.1a3.6 3.6 0 0 1 6.2 3.1V14z" fill="currentColor" opacity=".55" />
    </svg>
  );
}

export function Cap() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" focusable="false" style={{ color: "var(--ink)" }}>
      <path d="M1 5.5 8 2.5l7 3-7 3z" fill="currentColor" />
      <path d="M4 7.6v3.2c0 1.2 1.8 2.2 4 2.2s4-1 4-2.2V7.6L8 9.3z" fill="currentColor" opacity=".55" />
      <path d="M14.3 6.2v4.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
