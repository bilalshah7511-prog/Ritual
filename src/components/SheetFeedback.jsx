import { useEffect } from 'react';

/** Brief floating micro feedback (check/error) over the active sheet */
export default function SheetFeedback({ type, onDone }) {
  useEffect(() => {
    if (!type) return undefined;
    const t = setTimeout(() => onDone?.(), 1400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  if (!type) return null;

  const isError = type === 'error';

  return (
    <div className={`sheet-feedback${isError ? ' sheet-feedback--error' : ''}`} aria-hidden="true">
      <div className="sheet-feedback__icon">
        <svg viewBox="0 0 52 52" width="72" height="72">
          <circle className="sheet-feedback__circle" cx="26" cy="26" r="24" fill="none" />
          {isError ? (
            <path
              className="sheet-feedback__mark"
              fill="none"
              d="M18 18l16 16M34 18L18 34"
            />
          ) : (
            <path
              className="sheet-feedback__mark"
              fill="none"
              d="M14.5 27.2l7.2 7.2 15.8-16.4"
            />
          )}
        </svg>
      </div>
    </div>
  );
}
