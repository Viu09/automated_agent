export function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <span>{subtitle}</span>
    </div>
  );
}
