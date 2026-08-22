export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand-mark" aria-label="Arthra">
      <span className="brand-mark__glyph">₹</span>
      {!compact && <span className="brand-mark__word">arthra</span>}
    </span>
  );
}
