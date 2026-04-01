// Detects if text contains Hebrew characters and applies RTL automatically
export function HebrewText({ children, className }: { children: string; className?: string }) {
  const hasHebrew = /[\u0590-\u05FF]/.test(children);
  return (
    <span
      dir={hasHebrew ? "rtl" : "ltr"}
      className={className}
      style={{ display: 'inline-block', textAlign: hasHebrew ? 'right' : 'left' }}
    >
      {children}
    </span>
  );
}
