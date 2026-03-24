export default function EmptyState({ title, message, primaryLabel, secondaryLabel, onPrimary, onSecondary }) {
  return (
    <div className="catalog-empty">
      <svg viewBox="0 0 240 180" className="empty-illustration" aria-hidden="true">
        <rect x="36" y="34" width="168" height="112" rx="18" fill="rgba(255,253,248,0.9)" stroke="rgba(216,205,189,0.9)" />
        <rect x="56" y="58" width="128" height="10" rx="5" fill="rgba(187,90,60,0.14)" />
        <rect x="56" y="80" width="92" height="10" rx="5" fill="rgba(119,103,86,0.12)" />
        <rect x="56" y="102" width="110" height="10" rx="5" fill="rgba(119,103,86,0.12)" />
        <circle cx="181" cy="62" r="18" fill="rgba(187,90,60,0.16)" />
        <path d="M176 62h10M181 57v10" stroke="#bb5a3c" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <h3>{title}</h3>
      <p>{message}</p>
      <div className="empty-actions">
      
      
      </div>
    </div>
  );
}
