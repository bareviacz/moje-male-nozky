'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ChildPicker, type PickerChild } from './ChildPicker'
import { cx, Field, inputClass } from './ui'
import { CATALOG, fitProduct, type Audience, type CatalogProduct } from '@/lib/eshop-catalog'
import { NEW_SHOE_MAX_EXTRA_MM, NEW_SHOE_MIN_EXTRA_MM } from '@/lib/fit'

export type AdvisorChild = PickerChild & { lengthMm: number | null; widthMm: number | null; sex: string | null }

const AUD_LABEL: Record<Audience, string> = { all: 'Holky i kluci', girl: 'Holky', boy: 'Kluci' }
const price = (p: number | null) => (p ? `${new Intl.NumberFormat('cs-CZ').format(p)} Kč` : null)
const stockDate = CATALOG.stockDate.split('-').reverse().map(Number).join('. ')

/** Přijme „145“, „14,5“ i „14.5“ – hodnoty do 30 bere jako centimetry. */
function parseMm(value: string): number | null {
  const v = parseFloat(value.replace(',', '.').replace(/[^0-9.]/g, ''))
  if (!isFinite(v) || v <= 0) return null
  return Math.round(v < 30 ? v * 10 : v)
}

function audienceFor(sex: string | null): Audience {
  return sex === 'girl' ? 'girl' : sex === 'boy' ? 'boy' : 'all'
}

export function SizeAdvisor({ items, initialId }: { items: AdvisorChild[]; initialId?: string }) {
  const first = items.find((c) => c.id === initialId) ?? items[0]
  const [childId, setChildId] = useState(first?.id ?? '')
  const [len, setLen] = useState(first?.lengthMm != null ? String(first.lengthMm) : '')
  const [wid, setWid] = useState(first?.widthMm != null ? String(first.widthMm) : '')
  const [aud, setAud] = useState<Audience>(audienceFor(first?.sex ?? null))

  function pickChild(id: string) {
    const c = items.find((x) => x.id === id)
    setChildId(id)
    setLen(c?.lengthMm != null ? String(c.lengthMm) : '')
    setWid(c?.widthMm != null ? String(c.widthMm) : '')
    setAud(audienceFor(c?.sex ?? null))
  }

  const foot = parseMm(len)
  const width = parseMm(wid)
  const valid = foot != null && foot >= 80 && foot <= 280

  const result = useMemo(() => {
    if (!valid) return null
    const products = CATALOG.products.filter((p) => aud === 'all' || p.audience === aud || p.audience === 'all')
    const fits: { p: CatalogProduct; f: Extract<ReturnType<typeof fitProduct>, { kind: 'fit' }> }[] = []
    const rest: { p: CatalogProduct; why: string }[] = []
    for (const p of products) {
      const f = fitProduct(p, foot!, width)
      if (f.kind === 'fit') fits.push({ p, f })
      else
        rest.push({
          p,
          why:
            f.kind === 'noTable'
              ? 'tabulku zatím nemáme'
              : f.kind === 'tooBig'
                ? 'nejmenší velikost je zatím velká'
                : 'největší velikost už je malá',
        })
    }
    const rank = { ok: 0, alt: 1, out: 2 }
    fits.sort((a, b) => rank[a.f.status] - rank[b.f.status] || a.f.reserve - b.f.reserve)
    return { fits, rest, inStock: fits.filter((x) => x.f.status !== 'out').length }
  }, [valid, foot, width, aud])

  const child = items.find((c) => c.id === childId)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-[20px] border border-line bg-white p-4">
        {items.length > 0 && <ChildPicker items={items} value={childId} onChange={pickChild} legend="Pro koho hledáte" />}
        {child && child.lengthMm == null && (
          <p className="rounded-xl bg-sun-soft px-3 py-2 text-sm text-sun-deep">
            {child.name} zatím nemá měření. Zadejte délku ručně, nebo{' '}
            <Link href={`/mereni/nove?dite=${child.id}`} className="font-bold underline">
              změřte nožky
            </Link>
            .
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Délka chodidla (mm)" htmlFor="adv-len" hint="Delší nožka">
            <input id="adv-len" inputMode="decimal" className={inputClass} value={len} onChange={(e) => setLen(e.target.value)} placeholder="např. 145" />
          </Field>
          <Field label="Šířka (mm)" htmlFor="adv-wid" hint="Nepovinné">
            <input id="adv-wid" inputMode="decimal" className={inputClass} value={wid} onChange={(e) => setWid(e.target.value)} placeholder="např. 62" />
          </Field>
        </div>
        <fieldset className="flex flex-col">
          <legend className="mb-2 text-sm font-bold">Zobrazit boty</legend>
          <div className="flex flex-wrap gap-2">
            {(['all', 'girl', 'boy'] as Audience[]).map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={aud === a}
                onClick={() => setAud(a)}
                className={cx(
                  'h-11 rounded-xl px-4 text-sm',
                  aud === a ? 'bg-forest font-bold text-white' : 'border-[1.5px] border-field bg-white font-semibold',
                )}
              >
                {a === 'all' ? 'Všechny' : AUD_LABEL[a]}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {len.trim() !== '' && !valid && (
        <p className="rounded-2xl bg-sun-soft px-4 py-3 text-sm text-sun-deep">Zadejte délku chodidla v milimetrech, třeba 145.</p>
      )}

      {result && (
        <>
          <div>
            <h2 className="font-display text-xl font-bold">{result.fits.length ? 'Boty, které sednou' : 'Nic nesedí'}</h2>
            <p className="text-sm text-muted">
              Chodidlo {foot} mm → hledáme vnitřní délku {foot! + NEW_SHOE_MIN_EXTRA_MM}–{foot! + NEW_SHOE_MAX_EXTRA_MM} mm.
              {result.fits.length > 0 && ` Skladem ${result.inStock} z ${result.fits.length}.`}
            </p>
          </div>
          <ul className="grid gap-3 md:grid-cols-2">
            {result.fits.map(({ p, f }) => (
              <li
                key={p.url}
                className={cx('flex flex-col gap-3 rounded-[20px] border border-line bg-white p-4', f.status === 'out' && 'opacity-80')}
              >
                <div className="flex items-start gap-3">
                  {p.img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.img} alt="" loading="lazy" className="size-[68px] shrink-0 rounded-xl border border-line object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] leading-snug font-bold [overflow-wrap:anywhere]">{p.name}</p>
                    <p className="text-[13px] text-muted">{[AUD_LABEL[p.audience], price(p.price)].filter(Boolean).join(' · ')}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[11px] font-semibold tracking-wide text-muted uppercase">Velikost</div>
                    <div className="font-display text-3xl leading-none font-bold">{f.shown.size}</div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {f.status === 'ok' && <span className="rounded-full bg-forest-soft px-2.5 py-0.5 text-xs font-bold text-forest">Skladem</span>}
                  {f.status === 'alt' && (
                    <span className="rounded-full bg-sun-soft px-2.5 py-0.5 text-xs font-bold text-sun-ink">
                      {f.pick.size} došla, skladem je {f.alt!.size}
                    </span>
                  )}
                  {f.status === 'out' && (
                    <span className="rounded-full bg-coral-soft px-2.5 py-0.5 text-xs font-bold text-coral-ink">Velikost {f.pick.size} je vyprodaná</span>
                  )}
                  <span className="text-[13px] text-muted">
                    Stélka {f.shown.innerMm} mm, rezerva {f.reserve} mm
                  </span>
                </div>
                {f.roomy && (
                  <p className="text-[13px] text-muted">
                    Rezerva je větší než {NEW_SHOE_MAX_EXTRA_MM} mm{f.shown === f.rows[0] ? ', menší velikost model nemá.' : ', menší velikost by už byla krátká.'}
                  </p>
                )}
                <div className="flex flex-wrap gap-1">
                  {f.rows.map((s) => {
                    const picked = s === f.shown
                    return (
                      <span
                        key={s.size}
                        title={s.inStock ? 'skladem' : 'vyprodáno'}
                        className={cx(
                          'min-w-[34px] rounded-md border px-1.5 py-0.5 text-center text-[13px]',
                          picked ? 'border-forest bg-forest font-bold text-white' : 'border-line',
                          f.alt && s === f.pick && 'border-dashed border-forest',
                          !s.inStock && !picked && 'text-muted line-through',
                        )}
                      >
                        {s.size}
                      </span>
                    )
                  })}
                </div>
                {f.widthNote && <p className="text-[13px] text-sun-ink">{f.widthNote}</p>}
                <a href={p.url} target="_blank" rel="noopener" className="inline-flex h-11 items-center self-start rounded-xl bg-forest px-4 text-sm font-bold text-white hover:bg-forest-dark">
                  Zobrazit v e-shopu
                </a>
              </li>
            ))}
          </ul>
          {result.rest.length > 0 && (
            <details className="rounded-[20px] border border-line bg-white px-4 py-3 text-sm">
              <summary className="cursor-pointer font-bold">Další boty ({result.rest.length}), které teď nesedí</summary>
              <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-muted">
                {result.rest.map(({ p, why }) => (
                  <li key={p.url}>
                    <a href={p.url} target="_blank" rel="noopener" className="text-forest underline">
                      {p.name}
                    </a>{' '}
                    ({why})
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}

      <p className="text-[13px] text-muted">
        Doporučení vychází z vnitřní délky stélky podle velikostní tabulky u každého modelu. Sklad podle stavu k {stockDate} – aktuální
        dostupnost ověřte na stránce produktu.
      </p>
    </div>
  )
}
