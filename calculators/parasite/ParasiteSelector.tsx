"use client";

import { useRef, useState } from 'react';
import type { ParasiteCoverage, ParasiteKey, Product, Species } from './types';
import { parasiteProducts } from './data/parasiteProducts';
import { parasites } from './data/parasites';
import { copy } from './labels';
import { comparisonColumns, matchProduct, MAX_COMPARE, productsForSpecies, toggleComparison } from './logic';

function Coverage({ value }: { value: ParasiteCoverage }) {
  const status = copy.statuses[value.status];
  return <span className={`ps-status ps-status-${value.status}`} role="img" aria-label={status.label}
    title={[status.label, value.notes].filter(Boolean).join(' — ')}>{status.symbol}</span>;
}

function CoverageList({ product, selected, vet = false }: { product: Product; selected: ParasiteKey[]; vet?: boolean }) {
  return <ul className="ps-coverage-list">{parasites.filter(p => selected.includes(p.key)).map(p => {
    const value = product.coverage[p.key];
    return <li key={p.key}><div><span>{p.label}</span><Coverage value={value} /></div>
      {value.notes && <small>{value.notes}</small>}
      {vet && value.indicationType && <small>{copy.indication}: {copy.indications[value.indicationType]}</small>}
      {vet && !!value.sourceIds?.length && <small>{copy.sourceIds}: {value.sourceIds.join(', ')}</small>}
    </li>;
  })}</ul>;
}

function Gaps({ product, selected }: { product: Product; selected: ParasiteKey[] }) {
  const match = matchProduct(product, selected);
  return <>{(['missing', 'limited', 'unverified'] as const).map(key => match[key].length > 0 &&
    <p key={key} className={`ps-gap ps-gap-${key}`}><strong>{key === 'unverified' ? copy.unknown : copy[key]}: </strong>
      {parasites.filter(p => match[key].includes(p.key)).map(p => p.label).join(', ')}</p>)}</>;
}

function ProductDetails({ product, vet }: { product: Product; vet: boolean }) {
  const fields = vet ? Object.keys(copy.fields) as (keyof typeof copy.fields)[] : ['route', 'interval'] as const;
  return <>
    <dl className="ps-fields">{fields.map(field => <div key={field}><dt>{copy.fields[field]}</dt>
      <dd>{field === 'activeIngredients' ? product.activeIngredients?.join(' + ') || copy.notVerified : product[field] || copy.notVerified}</dd></div>)}</dl>
    <h3>{copy.coverage}</h3>
    <CoverageList product={product} selected={parasites.map(p => p.key)} vet={vet} />
    <Gaps product={product} selected={parasites.map(p => p.key)} />
    <h3>{copy.warnings}</h3>
    {product.warnings?.length ? product.warnings.map(warning => <p className={`ps-warning ps-warning-${warning.severity}`} key={warning.title}><strong>{warning.title}</strong><br />{warning.description}</p>) : <p>{copy.notVerified}</p>}
    {vet && <><h3>{copy.sources}</h3>{product.sources.length ? <ul className="ps-sources">{product.sources.map(source =>
      <li key={source.id}><strong>{source.id}: </strong>{source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> : source.title}
        <small>{source.jurisdiction} · {copy.sourceDate}: {source.verifiedDate || copy.notVerified}</small></li>)}</ul> : <p>{copy.notVerified}</p>}</>}
  </>;
}

export function ComparisonMatrix({ products, all, differences, onDetails }: {
  products: Product[]; all: boolean; differences: boolean; onDetails: (product: Product) => void;
}) {
  const columns = comparisonColumns(products, all, differences);
  if (!products.length) return <p className="ps-muted">{copy.compareEmpty}</p>;
  if (!columns.length) return <p className="ps-notice" role="status">{copy.same}</p>;
  return <><p className="ps-muted">{copy.scroll}</p>
    <div className="ps-table-scroll" tabIndex={0} role="region" aria-label={copy.matrix}>
      <table className="ps-matrix"><caption className="ps-sr-only">{copy.matrix}</caption>
        <thead><tr><th scope="col">{copy.product}</th>{columns.map(p => <th scope="col" key={p.key}>
          <details className="ps-heading-help"><summary aria-label={p.label}><span className="ps-wide-name">{p.label}</span><span className="ps-short-name">{p.short}</span></summary><span>{p.label}</span></details>
        </th>)}</tr></thead>
        <tbody>{products.map(product => <tr key={product.id} onClick={() => onDetails(product)}>
          <th scope="row"><button type="button" onClick={event => { event.stopPropagation(); onDetails(product); }}>{product.name}<small>{copy.details}</small></button></th>
          {columns.map(p => <td key={p.key}><Coverage value={product.coverage[p.key]} /></td>)}
        </tr>)}</tbody>
      </table>
    </div>
  </>;
}

export default function ParasiteSelector() {
  const [species, setSpecies] = useState<Species>('dog');
  const [mode, setMode] = useState<string | null>(null);
  const [vet, setVet] = useState(false);
  const [selected, setSelected] = useState<ParasiteKey[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [all, setAll] = useState(false);
  const [differences, setDifferences] = useState(false);
  const [detail, setDetail] = useState<Product | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const products = productsForSpecies(parasiteProducts, species);
  const compared = products.filter(p => compareIds.includes(p.id));
  function openDetails(product: Product) {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setDetail(product);
    dialog.current?.showModal();
  }
  function changeSpecies(next: Species) {
    setSpecies(next); setCompareIds([]); setDetail(null); dialog.current?.close();
  }
  function productCard(product: Product) {
    return <article className="ps-product-card" key={product.id}>
      <h3>{product.name}</h3>
      <p className="ps-muted">{copy.fields.route}: {product.route || copy.notVerified}<br />{copy.fields.interval}: {product.interval || copy.notVerified}</p>
      {vet && <p className="ps-muted">{copy.fields.activeIngredients}: {product.activeIngredients?.join(' + ') || copy.notVerified}</p>}
      <CoverageList product={product} selected={selected} vet={vet} />
      <Gaps product={product} selected={selected} />
      <button type="button" className="toolkit-button" onClick={() => openDetails(product)} aria-label={`${copy.details}: ${product.name}`}>{copy.details}</button>
    </article>;
  }
  return <main className="toolkit-workspace ps-workspace">
    <div className="toolkit-intro"><h1>{copy.title}</h1><p>{copy.subtitle}</p></div>
    <div className="ps-top-controls">
      <fieldset className="species-picker"><legend>{copy.species}</legend><div className="segmented">
        {(['dog', 'cat'] as const).map(value => <button key={value} type="button" aria-pressed={species === value} onClick={() => changeSpecies(value)}><span className="species-emoji" aria-hidden="true">{value === 'dog' ? '🐕' : '🐈'}</span>{copy[value]}</button>)}
      </div></fieldset>
      <div className="ps-switch" role="group" aria-label={copy.view}>{[false, true].map(value => <button key={String(value)} type="button" aria-pressed={vet === value} onClick={() => setVet(value)}>{value ? copy.vet : copy.client}</button>)}</div>
    </div>
    <p className="ps-notice">{copy.prototype}</p>
    {!mode ? <div className="ps-modes">{copy.modes.map(item => <button type="button" className="toolkit-card" key={item.id} onClick={() => setMode(item.id)}><strong>{item.title}</strong><span>{item.description}</span><span aria-hidden="true">→</span></button>)}</div> : <>
      <button className="toolkit-button ps-back" type="button" onClick={() => setMode(null)}>{copy.back}</button>
      <h2 className="ps-mode-heading">{copy.modes.find(item => item.id === mode)?.title}</h2>
      {mode === 'identify' && <p className="clinical-status">{copy.coming}</p>}
      {mode === 'find' && <>
        <h3>{copy.selectParasites}</h3>
        {(['ecto', 'endo'] as const).map(group => <fieldset className="ps-parasite-group" key={group}><legend>{copy.groups[group]}</legend><div className="ps-chips">{parasites.filter(p => p.group === group).map(p =>
          <button type="button" key={p.key} aria-pressed={selected.includes(p.key)} title={vet ? p.key : p.label} onClick={() => setSelected(current => current.includes(p.key) ? current.filter(key => key !== p.key) : [...current, p.key])}><span aria-hidden="true">{selected.includes(p.key) ? '☑' : '☐'}</span> {p.label}</button>)}</div></fieldset>)}
        {!selected.length ? <p className="ps-muted">{copy.selectPrompt}</p> : <>
          <p className="ps-sr-only" role="status">{selected.length} selected</p>
          {(['full', 'partial', 'unverified', 'none'] as const).map(group => {
            const matches = products.filter(p => matchProduct(p, selected).group === group);
            if (group === 'none') return matches.length > 0 && <details className="ps-no-match" key={group}><summary>{copy.matches[group]} ({matches.length})</summary><p className="ps-muted">{copy.matchHelp[group]}</p><div className="ps-products">{matches.map(productCard)}</div></details>;
            return <section className="ps-match-group" key={group}><h3>{copy.matches[group]} <span>({matches.length})</span></h3>{matches.length > 0 && <><p className="ps-muted">{copy.matchHelp[group]}</p><div className="ps-products">{matches.map(productCard)}</div></>}</section>;
          })}
        </>}
      </>}
      {mode === 'compare' && <>
        <h3>{copy.selectProducts}</h3><p className="ps-muted">{copy.comparePrompt}</p>
        <div className="ps-chips">{products.map(p => <button type="button" key={p.id} aria-pressed={compareIds.includes(p.id)} disabled={compareIds.length >= MAX_COMPARE && !compareIds.includes(p.id)} onClick={() => setCompareIds(current => toggleComparison(current, p.id))}>{p.name}{compareIds.includes(p.id) && <span aria-hidden="true"> ×</span>}</button>)}</div>
        {compareIds.length === MAX_COMPARE && <p className="ps-muted" role="status">{copy.limit}</p>}
        <div className="ps-table-controls"><div className="ps-switch" role="group" aria-label={copy.scope}>{[false, true].map(value => <button type="button" key={String(value)} aria-pressed={all === value} onClick={() => setAll(value)}>{value ? copy.all : copy.common}</button>)}</div>
          <label className="ps-check"><input type="checkbox" checked={differences} onChange={event => setDifferences(event.target.checked)} />{copy.differences}</label></div>
        <ComparisonMatrix products={compared} all={all} differences={differences} onDetails={openDetails} />
        {compared.length > 0 && <div className="ps-comparison-details">{compared.map(product => <details key={product.id}><summary>{product.name} — {copy.details}</summary><ProductDetails product={product} vet={vet} /></details>)}</div>}
      </>}
      {mode !== 'identify' && <ul className="ps-legend" aria-label={copy.coverage}>{Object.entries(copy.statuses).map(([key, status]) => <li key={key}><span aria-hidden="true">{status.symbol}</span> {status.label}</li>)}</ul>}
    </>}
    <p className="ps-disclaimer">{copy.disclaimer}</p>
    <dialog ref={dialog} className="ps-dialog" aria-labelledby="ps-detail-title" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }} onClose={() => returnFocus.current?.focus()}>
      <div className="ps-dialog-content"><div className="ps-dialog-heading"><h2 id="ps-detail-title">{detail?.name}</h2><button type="button" autoFocus className="toolkit-button" aria-label={copy.close} onClick={() => dialog.current?.close()}>×</button></div>
        {detail && <ProductDetails product={detail} vet={vet} />}
      </div>
    </dialog>
  </main>;
}
