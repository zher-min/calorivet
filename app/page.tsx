import InstallApp from "../components/layout/AppInstall";
import OpenCalculatorsButton from "../components/layout/OpenCalculatorsButton";
import { releases } from "../config/releases";

export default function Home() {
  const [current, ...previous] = releases;
  return <main className="toolkit-workspace home-workspace">
    <section className="home-intro" aria-labelledby="home-title">
      <div><picture className="home-brand"><source media="(prefers-color-scheme: dark)" srcSet="/brand/vetslate-logo-dark.svg" /><img src="/brand/vetslate-logo.svg" alt="VetSlate" /></picture><h1 className="sr-only" id="home-title">VetSlate</h1><p className="toolkit-subtitle">Tools for the Veterinarian</p><p>Fast, practical clinical tools for veterinary practice.</p></div>
      <OpenCalculatorsButton />
    </section>
    <section className="release-section" aria-labelledby="whats-new-title">
      <div className="release-heading"><div><span>Release notes</span><h2 id="whats-new-title">What’s new</h2></div><time dateTime={current.date}>{current.date}</time></div>
      <article className="release-current">
        <div className="release-version"><span>{current.version}</span><span>Current</span></div>
        <h3>{current.title}</h3><p>{current.summary}</p>
        <ul>{current.changes.map(change => <li key={change}>{change}</li>)}</ul>
      </article>
      <details className="release-history">
        <summary>Previous updates <span>{previous.length} releases</span></summary>
        <div>{previous.map(release => <article className="release-item" key={release.version}>
          <div><span>{release.version}</span><time dateTime={release.date}>{release.date}</time></div>
          <h3>{release.title}</h3><p>{release.summary}</p>
        </article>)}</div>
      </details>
    </section>
    <div className="home-install"><InstallApp /></div>
  </main>;
}
