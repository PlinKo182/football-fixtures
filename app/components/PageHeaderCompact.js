import ThemeToggle from './ThemeToggle';
import Link from 'next/link';

export default function PageHeaderCompact({ title, subtitle, rightActions }) {
  return (
    <header className="header-compact">
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title-compact">{title}</h1>
          {subtitle && <p className="page-subtitle-compact">{subtitle}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ThemeToggle />
          {rightActions}
        </div>
      </div>
    </header>
  );
}
