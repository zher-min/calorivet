export default function Loading() {
  return <div className="route-loading route-loading--boundary" role="status" aria-live="polite">
    <img className="route-loading-mark" src="/brand/vetslate-symbol.svg" alt="" />
    <span className="route-loading-spinner" aria-hidden="true" />
    <strong>Loading…</strong>
  </div>;
}
