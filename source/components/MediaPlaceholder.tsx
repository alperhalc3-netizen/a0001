
type Props = {
  label: string;
  title?: string;
  aspect?: string;
};

export function MediaPlaceholder({ label, title, aspect = "4 / 5" }: Props) {
  const alt = title
    ? `Placeholder for ${title} (${label}). Original artwork image to be added.`
    : `Placeholder visual, ${label}. Original artwork image to be added.`;

  return (
    <div
      className="media-ph"
      style={{ aspectRatio: aspect }}
      role="img"
      aria-label={alt}
    >
      <span className="ph-label">{label} · Placeholder</span>
      {title ? <span className="ph-title">{title}</span> : <span />}
    </div>
  );
}
