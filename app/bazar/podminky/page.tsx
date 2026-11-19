import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, PageTitle } from '@/components/ui'
import { ESHOP_TERMS_URL, PRIVACY_URL } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Podmínky užívání Bazárku',
  description: 'Pravidla Bazárku Barevia: kdo za co odpovídá při prodeji a nákupu bazarových barefoot botiček.',
}

const UPDATED = '19. 11. 2026'

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-lg font-bold">
        {n}. {title}
      </h2>
      <div className="flex flex-col gap-2 text-[15px] leading-relaxed text-ink/90 [&_li]:ml-5 [&_li]:list-disc">{children}</div>
    </section>
  )
}

export default function TermsPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <PageTitle>Podmínky užívání Bazárku</PageTitle>
      <p className="text-sm text-muted">Platné od {UPDATED}</p>

      <Card className="flex flex-col gap-6 p-5 sm:p-7">
        <Section n={1} title="Kdo Bazárek provozuje">
          <p>
            Bazárek na adrese bazar.barevia.cz provozuje Ing. Helena Tylová, IČ 86845268, Vlčí 93, 440 01 Chlumčany, provozovatelka
            e-shopu www.barevia.cz (dále jen „Barevia“). Kontakt: <a href="mailto:barevia@seznam.cz" className="font-bold text-forest underline">barevia@seznam.cz</a>.
          </p>
          <p>Používáním Bazárku souhlasíte s těmito podmínkami. Pokud s nimi nesouhlasíte, Bazárek prosím nepoužívejte.</p>
        </Section>

        <Section n={2} title="Co Bazárek je">
          <p>
            Bazárek je místo, kde si rodiče mezi sebou prodávají a kupují použité i nové dětské boty. Barevia poskytuje jen prostor pro
            inzeráty a nástroje k domluvě (rezervace, QR kód pro platbu, zprávy).
          </p>
          <p>
            Kupní smlouva vzniká <strong>přímo mezi kupujícím a prodávajícím</strong>. Barevia není stranou této smlouvy, neprodává
            jménem uživatelů a nepřijímá za ně peníze – kupující platí prodávajícímu přímo na jeho účet.
          </p>
        </Section>

        <Section n={3} title="Za co Barevia neodpovídá">
          <p>U inzerátů ostatních uživatelů Barevia neodpovídá zejména za:</p>
          <ul>
            <li>stav, popis, rozměry, fotky a pravost nabízených bot,</li>
            <li>to, zda prodávající boty skutečně odešle a kupující zaplatí,</li>
            <li>platby mezi uživateli a jejich případné vracení,</li>
            <li>doručení, ztrátu nebo poškození zásilky u dopravce,</li>
            <li>spory mezi kupujícím a prodávajícím a jejich řešení.</li>
          </ul>
          <p>
            Tím nejsou dotčena práva, která nelze podle zákona předem vyloučit nebo omezit (například odpovědnost za škodu způsobenou
            úmyslně nebo z hrubé nedbalosti).
          </p>
        </Section>

        <Section n={4} title="Povinnosti prodávajícího">
          <ul>
            <li>Nabízí jen boty, které vlastní a smí prodat.</li>
            <li>Popis, velikost, rozměry a fotky odpovídají skutečnosti, vady na botách uvede.</li>
            <li>Po zaplacení boty včas odešle podle zvolené dopravy.</li>
            <li>Údaje kupujícího (jméno, e-mail, telefon) použije jen k vyřízení objednávky.</li>
          </ul>
        </Section>

        <Section n={5} title="Nákup od soukromé osoby">
          <p>
            Kupujete-li od jiného rodiče (soukromé osoby), nevztahuje se na nákup 14denní lhůta pro odstoupení od smlouvy ani práva
            spotřebitele vůči podnikateli. Případné vady nebo vrácení řešíte přímo s prodávajícím.
          </p>
          <p>Doporučujeme zkontrolovat fotky podrážky a stélky, rozměry a dotázat se prodávajícího ještě před rezervací.</p>
        </Section>

        <Section n={6} title="Boty, které prodává přímo Barevia">
          <p>
            U inzerátů označených „Prodává Barevia“ je prodávajícím Barevia jako podnikatel. Pro tyto nákupy platí{' '}
            <a href={ESHOP_TERMS_URL} target="_blank" rel="noopener" className="font-bold text-forest underline">
              obchodní podmínky e-shopu barevia.cz
            </a>
            , včetně 14denní lhůty pro odstoupení od smlouvy a zákonných práv z vadného plnění.
          </p>
        </Section>

        <Section n={7} title="Zakázaný obsah a zrušení inzerátu">
          <p>
            Barevia může bez náhrady skrýt nebo smazat inzerát, který je nepravdivý, nevhodný, porušuje zákon nebo tyto podmínky, a
            může zablokovat účet uživatele, který podmínky opakovaně porušuje. Inzerovat lze jen dětskou a rodinnou obuv.
          </p>
        </Section>

        <Section n={8} title="Osobní údaje">
          <p>
            Při rezervaci uvidí kupující a prodávající navzájem jméno, e-mail a telefon, aby se mohli domluvit. Číslo účtu prodávajícího
            se kupujícímu zobrazí až v QR kódu pro platbu. Další informace najdete v{' '}
            <a href={PRIVACY_URL} target="_blank" rel="noopener" className="font-bold text-forest underline">
              zásadách ochrany osobních údajů
            </a>
            .
          </p>
        </Section>

        <Section n={9} title="Změny podmínek">
          <p>
            Barevia může tyto podmínky změnit. Novou verzi zveřejní na této stránce s datem účinnosti. Dalším používáním Bazárku
            vyjadřujete souhlas s aktuální verzí.
          </p>
        </Section>
      </Card>

      <Link href="/bazar" className="self-start text-sm font-bold text-forest">
        ← Zpět do Bazárku
      </Link>
    </div>
  )
}
