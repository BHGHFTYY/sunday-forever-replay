"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatMoney, track, type Locale } from "@ucp/core";
import type { Suggestion } from "@ucp/core";
import { Icon } from "@/components/ui/Icon.tsx";
import { getDictionary } from "@/i18n/dictionary.ts";
import { routes } from "@/lib/routes.ts";

/**
 * Search with suggestions.
 *
 * Built as a WAI-ARIA combobox: the input keeps focus and owns the
 * keyboard, the listbox is referenced by `aria-controls`, and the active
 * option is announced through `aria-activedescendant`. That is what makes
 * arrow-key navigation work for a screen reader user instead of silently
 * moving a highlight they cannot perceive.
 *
 * Categories and brands are listed above products, because a broad query
 * like "شعر" almost always means "take me to the hair section", and a
 * pure product list buries that.
 */
export function SearchBar({
  locale, autoFocus = false, initialQuery = "", size = "md",
}: {
  locale: Locale;
  autoFocus?: boolean;
  initialQuery?: string;
  size?: "md" | "lg";
}) {
  const t = getDictionary(locale);
  const router = useRouter();
  const listboxId = useId();

  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);

  // Debounced fetch. 180ms is short enough to feel immediate and long
  // enough that a fast typist does not fire a request per keystroke.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search/suggest?q=${encodeURIComponent(trimmed)}&locale=${locale}`,
        );
        if (!response.ok) throw new Error("suggest_failed");
        const body = (await response.json()) as { suggestions: Suggestion[] };
        if (id !== requestId.current) return;
        setSuggestions(body.suggestions);
        setActiveIndex(-1);
      } catch {
        if (id === requestId.current) setSuggestions([]);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query, locale]);

  // Close on outside click.
  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function submit(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setOpen(false);
    inputRef.current?.blur();
    router.push(routes.search(locale, trimmed));
  }

  function choose(suggestion: Suggestion) {
    track({
      name: "search_suggestion_click",
      query: query.trim(),
      kind: suggestion.kind,
      targetId: suggestion.id,
    });
    setOpen(false);
    router.push(suggestion.href);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!open || suggestions.length === 0) {
      if (event.key === "Enter") submit(query);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const active = suggestions[activeIndex];
      if (active) choose(active);
      else submit(query);
    }
  }

  const height = size === "lg" ? "h-14" : "h-12";
  const showPanel = open && query.trim().length >= 2;

  const grouped = {
    category: suggestions.filter((s) => s.kind === "category"),
    brand: suggestions.filter((s) => s.kind === "brand"),
    product: suggestions.filter((s) => s.kind === "product"),
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          submit(query);
        }}
      >
        <div
          className={`relative flex ${height} items-center rounded-md border border-border bg-surface transition-[border-color,box-shadow] focus-within:border-primary focus-within:shadow-focus`}
        >
          <span className="pointer-events-none absolute inset-inline-start-0 start-0 flex h-full w-12 items-center justify-center text-text-muted">
            <Icon name="search" size={20} />
          </span>

          <input
            ref={inputRef}
            type="search"
            value={query}
            autoFocus={autoFocus}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={t.search.placeholder}
            aria-label={t.search.label}
            // Combobox wiring. Without activedescendant, arrow keys move a
            // highlight that assistive tech never hears about.
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
            }
            enterKeyHint="search"
            autoComplete="off"
            className="h-full w-full bg-transparent px-12 text-base outline-none placeholder:text-text-muted [&::-webkit-search-cancel-button]:hidden"
          />

          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                inputRef.current?.focus();
              }}
              aria-label={t.search.clear}
              className="absolute inset-inline-end-0 end-0 flex h-full w-12 items-center justify-center text-text-muted hover:text-text"
            >
              <Icon name="close" size={18} />
            </button>
          ) : null}
        </div>
      </form>

      {showPanel ? (
        <div className="absolute inset-inline-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
          <ul id={listboxId} role="listbox" aria-label={t.search.suggestions} className="py-1.5">
            {loading && suggestions.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-text-muted">{t.search.searching}</li>
            ) : null}

            {!loading && suggestions.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-text-muted">
                {t.search.noResultsFor} “{query.trim()}”
              </li>
            ) : null}

            {(["category", "brand", "product"] as const).map((kind) => {
              const items = grouped[kind];
              if (items.length === 0) return null;
              const heading =
                kind === "category" ? t.search.inCategories
                : kind === "brand" ? t.search.inBrands
                : t.search.products;

              return (
                <li key={kind}>
                  <p
                    className="px-4 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-text-muted"
                    id={`${listboxId}-group-${kind}`}
                  >
                    {heading}
                  </p>
                  <ul role="group" aria-labelledby={`${listboxId}-group-${kind}`}>
                    {items.map((suggestion) => {
                      const index = suggestions.indexOf(suggestion);
                      const active = index === activeIndex;
                      return (
                        <li
                          key={`${suggestion.kind}-${suggestion.id}`}
                          id={`${listboxId}-option-${index}`}
                          role="option"
                          aria-selected={active}
                        >
                          <Link
                            href={suggestion.href}
                            onClick={() => choose(suggestion)}
                            onMouseEnter={() => setActiveIndex(index)}
                            className={`flex items-center gap-3 px-4 py-2.5 ${active ? "bg-jade-50" : ""}`}
                          >
                            {suggestion.imageUrl ? (
                              <Image
                                src={suggestion.imageUrl}
                                alt=""
                                width={40}
                                height={40}
                                className="size-10 shrink-0 rounded-sm bg-sand-50 object-contain"
                              />
                            ) : (
                              <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-jade-50 text-primary-text">
                                <Icon name={suggestion.kind === "brand" ? "tag" : "sparkle"} size={18} />
                              </span>
                            )}

                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold text-text ucp-clamp-1">
                                {suggestion.label}
                              </span>
                              {suggestion.sublabel ? (
                                <span className="block text-xs text-text-muted ucp-clamp-1">
                                  {suggestion.sublabel}
                                </span>
                              ) : null}
                            </span>

                            {suggestion.price !== undefined ? (
                              <span className="numeric shrink-0 text-sm font-bold text-text">
                                {formatMoney(suggestion.price, locale)}
                              </span>
                            ) : (
                              <Icon name="chevronEnd" size={16} className="shrink-0 text-text-muted" />
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}

            {suggestions.length > 0 ? (
              <li className="border-t border-border mt-1.5 pt-1.5">
                <button
                  type="button"
                  onClick={() => submit(query)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-sm font-semibold text-primary-text hover:bg-jade-50"
                >
                  <span>
                    {t.search.submit} “{query.trim()}”
                  </span>
                  <Icon name="chevronEnd" size={16} />
                </button>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
