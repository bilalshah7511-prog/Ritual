import ErrorBoundary from './ErrorBoundary';
import MicroAnim from './MicroAnim';

export default function StatusOverlay({ open, type = 'check', title, text, onDone }) {
  if (!open) return null;

  const isError = type === 'error';

  return (
    <div
      className={`success-overlay${isError ? ' success-overlay--error' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="success-card">
        <ErrorBoundary resetKey={type} fallback={null}>
          <MicroAnim type={isError ? 'error' : 'check'} className="micro-anim--hero" />
        </ErrorBoundary>
        <h3 className="success-card__title">{title}</h3>
        <p className="success-card__text">{text}</p>
        <button type="button" className="checkout-cta" onClick={onDone}>
          {isError ? 'Try again' : 'Continue shopping'}
        </button>
      </div>
    </div>
  );
}
