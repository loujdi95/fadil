export function InstagramIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function TikTokIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16.5 3c.3 2.1 1.5 3.6 3.5 3.9v2.5c-1.3.1-2.5-.3-3.5-1v5.9c0 3.4-2.7 5.7-5.7 5.7A5.5 5.5 0 0 1 5.3 14a5.4 5.4 0 0 1 6.2-5.4v2.7a2.7 2.7 0 0 0-1-.2 2.8 2.8 0 1 0 2.8 2.8V3h3.2Z" />
    </svg>
  );
}

export function SnapchatIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2.4c2.6 0 4.3 2 4.4 4.6 0 .6-.1 1.3-.1 1.9.3.2.7.3 1 .3.4 0 .8-.4 1.2-.4.5 0 1 .3 1 .9 0 .8-1.4 1.1-2 1.4-.3.1-.6.3-.6.6 0 .5 1.5 2.6 3.4 3 .3 0 .5.3.5.6 0 .8-1.9 1.1-2.4 1.2-.1.3-.1.9-.4 1-.3.2-1-.1-1.6-.1-.9 0-1.3.1-2 .6-.7.5-1.5 1.1-2.8 1.1s-2-.6-2.8-1.1c-.7-.5-1.1-.6-2-.6-.6 0-1.3.3-1.6.1-.3-.1-.3-.7-.4-1-.5-.1-2.4-.4-2.4-1.2 0-.3.2-.6.5-.6 1.9-.4 3.4-2.5 3.4-3 0-.3-.3-.5-.6-.6-.6-.3-2-.6-2-1.4 0-.5.5-.9 1-.9.4 0 .8.4 1.2.4.3 0 .7-.1 1-.3 0-.6-.1-1.3-.1-1.9C7.7 4.4 9.4 2.4 12 2.4Z" />
    </svg>
  );
}

export function ScissorsIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="6" cy="6" r="2.6" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="6" cy="18" r="2.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.2 7.6 20 18M8.2 16.4 20 6M12 12l2.2 1.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function ArrowIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
