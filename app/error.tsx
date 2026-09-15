"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="startup-error" role="alert">
    <img src="/brand/vetslate-symbol.svg" alt="VetSlate" />
    <h1>VetSlate couldn&apos;t finish loading.</h1>
    <p>Please try again.</p>
    <button type="button" className="toolkit-button" onClick={() => reset()}>Try again</button>
  </main>;
}
