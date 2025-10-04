export default function SectionHeader({ title, rightContent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
      <h2 className="section-title">{title}</h2>
      {rightContent && <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>{rightContent}</div>}
    </div>
  );
}
