export default function Loading() {
  return <div className="route-loading route-loading--boundary" role="status" aria-live="polite">
    <span className="route-loading-spinner" aria-hidden="true" />
    <strong>Loading calculator…</strong>
  </div>;
}
