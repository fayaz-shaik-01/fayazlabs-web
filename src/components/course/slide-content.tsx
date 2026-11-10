import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * Slide kinds: title, bullets, compare, callout, flow, code, cards, table, quiz.
 * The exact field names per kind live in the private course repo, so this
 * renderer works from the SHAPE of each value, not from fixed field names:
 *   text            -> paragraph (or a code block when the key says "code")
 *   list of text    -> bullets (a numbered flow for kind "flow")
 *   list of objects -> cards
 *   rows + headers  -> table
 *   two-part object -> side-by-side comparison
 * Anything else falls back to labelled text, so no field is ever dropped.
 * Sizes use container query units (cqw) so a slide scales with its stage,
 * which is what makes fullscreen simply "the same slide, bigger".
 */

const SKIP = new Set(["kind", "title", "subtitle"]);
const TITLE_KEYS = ["title", "name", "label", "heading", "term", "header", "question"];
const BODY_KEYS = ["text", "body", "description", "summary", "detail", "content", "answer", "explanation"];
const ANSWER_KEY = /answer|explanation|correct|solution|reveal/i;

const body = "text-[clamp(1rem,1.9cqw,1.6rem)] leading-[1.5]";

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
const isPrim = (v: unknown): v is string | number => typeof v === "string" || typeof v === "number";
const label = (k: string) => k.replace(/[_-]+/g, " ").replace(/\b\w/, (c) => c.toUpperCase());

function pickText(o: Obj, keys: string[]): string | null {
  for (const k of keys) if (isPrim(o[k])) return String(o[k]);
  return null;
}

function Bullets({ items }: Readonly<{ items: unknown[] }>) {
  return (
    <ul className="space-y-[0.6em]">
      {items.map((x, i) => (
        <li key={i} className="flex gap-[0.7em]">
          <span aria-hidden="true" className="mt-[0.62em] size-[0.42em] shrink-0 rounded-full bg-primary" />
          <span className="min-w-0">{isPrim(x) ? String(x) : <Value v={x} depth={1} />}</span>
        </li>
      ))}
    </ul>
  );
}

function Flow({ items }: Readonly<{ items: unknown[] }>) {
  return (
    <ol className="flex flex-wrap items-stretch gap-x-[0.5em] gap-y-[0.7em]">
      {items.map((x, i) => {
        const t = isPrim(x) ? String(x) : isObj(x) ? (pickText(x, TITLE_KEYS) ?? pickText(x, BODY_KEYS) ?? "") : "";
        const sub = isObj(x) ? pickText(x, BODY_KEYS) : null;
        return (
          <li key={i} className="flex items-center gap-[0.5em]">
            <div className="rounded-lg border border-border bg-card px-[0.9em] py-[0.55em]">
              <span className="eyebrow mr-2 tabular-nums !text-primary">{i + 1}</span>
              <span className="font-semibold">{t}</span>
              {sub && sub !== t && <span className="mt-0.5 block text-[0.85em] text-muted-foreground">{sub}</span>}
            </div>
            {i < items.length - 1 && <span aria-hidden="true" className="text-muted-foreground">→</span>}
          </li>
        );
      })}
    </ol>
  );
}

function Cards({ items }: Readonly<{ items: Obj[] }>) {
  return (
    <ul className="grid gap-[0.9em] [grid-template-columns:repeat(auto-fit,minmax(min(100%,15em),1fr))]">
      {items.map((o, i) => {
        const t = pickText(o, TITLE_KEYS);
        const rest = Object.entries(o).filter(([k, v]) => v != null && !(isPrim(v) && String(v) === t && TITLE_KEYS.includes(k)));
        return (
          <li key={i} className="rounded-xl border border-border bg-card p-[1em]">
            {t && <p className="font-heading text-[1.1em] font-bold leading-tight">{t}</p>}
            <div className={cn("space-y-1 text-[0.9em] text-muted-foreground", t && "mt-1.5")}>
              {rest.map(([k, v]) => (
                <div key={k}>{isPrim(v) ? String(v) : <Value v={v} depth={2} />}</div>
              ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Table({ headers, rows }: Readonly<{ headers: unknown[]; rows: unknown[] }>) {
  const cell = (c: unknown) => (isPrim(c) ? String(c) : isObj(c) ? Object.values(c).filter(isPrim).join(" · ") : "");
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse bg-card text-[0.9em]">
        {headers.length > 0 && (
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="border-b border-border bg-background px-3 py-2 text-left font-mono text-[0.7em] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                  {cell(h)}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border first:border-t-0">
              {(Array.isArray(r) ? r : isObj(r) ? Object.values(r) : [r]).map((c, j) => (
                <td key={j} className="px-3 py-2 align-top">{cell(c)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Code({ code, lang }: Readonly<{ code: string; lang?: string }>) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-[var(--code-bg)]">
      {lang && <p className="border-b border-border px-3 py-1.5 font-mono text-[0.7em] uppercase tracking-[0.06em] text-muted-foreground">{lang}</p>}
      <pre className="overflow-x-auto p-[0.9em] font-mono text-[0.82em] leading-[1.6]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Compare({ sides }: Readonly<{ sides: [string, unknown][] }>) {
  return (
    <div className="grid gap-[0.9em] sm:grid-cols-2">
      {sides.map(([k, v], i) => {
        // A side may carry its own heading ({heading, points}); otherwise the key names it.
        const own = isObj(v) ? TITLE_KEYS.find((t) => isPrim(v[t])) : undefined;
        const heading = own && isObj(v) ? String(v[own]) : label(k);
        const content = isObj(v) && own ? Object.fromEntries(Object.entries(v).filter(([ek]) => ek !== own)) : v;
        return (
          <section key={k} className={cn("rounded-xl border p-[1em]", i === 0 ? "border-border bg-card" : "border-primary/50 bg-accent")}>
            <h4 className="font-heading text-[1.1em] font-bold leading-tight">{heading}</h4>
            <div className="mt-2">
              <Value v={isObj(content) && Object.keys(content).length === 1 ? Object.values(content)[0] : content} depth={2} />
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Value({ v, k, kind, depth }: Readonly<{ v: unknown; k?: string; kind?: string; depth: number }>): ReactNode {
  if (v == null || depth > 3) return null;
  if (typeof v === "string" && k && /code|snippet/i.test(k)) return <Code code={v} />;
  if (isPrim(v)) return <p>{String(v)}</p>;

  if (Array.isArray(v)) {
    if (v.length === 0) return null;
    if (kind === "flow" || (k && /^(steps?|flow|nodes|stages|pipeline)$/i.test(k))) return <Flow items={v} />;
    if (v.every(isPrim)) return <Bullets items={v} />;
    if (v.every(isObj)) {
      const objs = v as Obj[];
      return objs.some((o) => pickText(o, TITLE_KEYS)) ? <Cards items={objs} /> : <Bullets items={v} />;
    }
    return <Bullets items={v} />;
  }

  if (isObj(v)) {
    if (Array.isArray(v.rows)) return <Table headers={(v.headers ?? v.columns ?? []) as unknown[]} rows={v.rows} />;
    if (typeof v.code === "string") return <Code code={v.code} lang={typeof v.language === "string" ? v.language : typeof v.lang === "string" ? v.lang : undefined} />;
    const entries = Object.entries(v).filter(([, x]) => x != null);
    return (
      <div className="space-y-2">
        {entries.map(([ek, ev]) => (
          <div key={ek}>
            <p className="eyebrow mb-1">{label(ek)}</p>
            <Value v={ev} k={ek} kind={kind} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }
  return null;
}

/** Shows one slide. `hideAnswer` withholds quiz answer fields until the player reveals them. */
export function SlideContent({
  content,
  hideAnswer = false,
}: Readonly<{ content: Record<string, unknown>; hideAnswer?: boolean }>) {
  const kind = typeof content.kind === "string" ? content.kind : "";
  const title = typeof content.title === "string" ? content.title : null;
  const subtitle = typeof content.subtitle === "string" ? content.subtitle : null;
  let rest = Object.entries(content).filter(([k, v]) => !SKIP.has(k) && v != null && !(hideAnswer && ANSWER_KEY.test(k)));
  // "code" + "language" as sibling fields: show the language as the block's header.
  const langKey = rest.find(([k, v]) => /^(language|lang)$/i.test(k) && typeof v === "string");
  const codeKey = rest.find(([k, v]) => /^code$/i.test(k) && typeof v === "string");
  const codeLang = codeKey && langKey ? String(langKey[1]) : undefined;
  if (codeLang) rest = rest.filter(([k]) => k !== langKey![0]);
  // A comparison is two side-by-side groups, whatever they are called (left/right, before/after, ...).
  const sideFields = rest.filter(([, v]) => isObj(v) || Array.isArray(v) || isPrim(v));
  const compareSides = kind === "compare" && sideFields.length === 2 && sideFields.every(([, v]) => !isPrim(v)) ? sideFields : null;
  if (compareSides) rest = rest.filter(([k]) => !compareSides.some(([sk]) => sk === k));
  const isTitleSlide = kind === "title" || (rest.length === 0 && !!title);

  return (
    <div data-testid="slide-content" data-kind={kind || undefined} className={cn("@container", isTitleSlide && "py-[2cqw]")}>
      {kind && <p className="chip mb-3">{kind}</p>}
      {title && (
        <h3
          className={cn(
            "font-heading font-bold leading-[1.1] tracking-[-0.02em] text-balance",
            isTitleSlide ? "text-[clamp(2rem,6cqw,4.25rem)]" : "text-[clamp(1.5rem,3.6cqw,2.75rem)]"
          )}
        >
          {title}
        </h3>
      )}
      {subtitle && <p className={cn("mt-2 max-w-[48ch] text-muted-foreground", isTitleSlide ? "text-[clamp(1.1rem,2.4cqw,1.8rem)]" : body)}>{subtitle}</p>}
      {(rest.length > 0 || compareSides) && (
        <div className={cn("mt-[1.1em] space-y-[1em]", body)}>
          {compareSides && <Compare sides={compareSides} />}
          {rest.map(([k, v]) => (
            <div key={k} data-field={k}>
              {typeof v === "string" && /^code$/i.test(k) ? (
                <Code code={v} lang={codeLang} />
              ) : Array.isArray(v) || isObj(v) || (typeof v === "string" && /code|snippet/i.test(k)) ? (
                <Value v={v} k={k} kind={kind} depth={0} />
              ) : (
                <p className={cn(kind === "quiz" && /question/i.test(k) && "font-heading text-[1.2em] font-bold leading-snug", kind === "callout" && "rounded-lg border border-dashed border-primary bg-accent px-[1em] py-[0.7em]", kind === "quiz" && ANSWER_KEY.test(k) && "rounded-lg bg-accent px-[1em] py-[0.7em]")}>
                  {String(v)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
