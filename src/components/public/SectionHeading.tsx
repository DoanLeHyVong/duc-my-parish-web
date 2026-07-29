export function SectionHeading({ eyebrow, title, light = false }: { eyebrow?: string; title: string; light?: boolean }) {
  return (
    <div className={`section-heading ${light ? 'light' : ''}`}>
      {eyebrow && <span>{eyebrow}</span>}
      <h2>{title}</h2>
      <i aria-hidden="true">✦</i>
    </div>
  );
}
