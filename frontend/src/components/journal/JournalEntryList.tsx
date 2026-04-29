'use client';

import { motion } from 'framer-motion';
import {
  Search,
  Sparkles,
  Loader2,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { MOODS } from '@/components/journal/JournalComposer';
import type { JournalEntry, JournalSearchHit } from '@/lib/api';

function formatDateLong(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

interface JournalEntryListProps {
  entries: JournalEntry[];
  filtered: JournalEntry[];
  loading: boolean;
  query: string;
  setQuery: (val: string) => void;
  semanticResults: JournalSearchHit[] | null;
  setSemanticResults: (val: JournalSearchHit[] | null) => void;
  semanticLoading: boolean;
  onSemanticSearch: () => void;
  onClearSemantic: () => void;
}

export function JournalEntryList({
  entries,
  filtered,
  loading,
  query,
  setQuery,
  semanticResults,
  setSemanticResults,
  semanticLoading,
  onSemanticSearch,
  onClearSemantic,
}: JournalEntryListProps) {
  return (
    <div className="mt-10">
      <div className="flex items-center gap-3">
        <h2 className="text-sm uppercase tracking-[0.22em] text-[color:var(--color-fg-subtle)]">
          Past entries
        </h2>
        <span className="text-xs text-[color:var(--color-fg-subtle)]">
          {loading ? '…' : `${entries.length} total`}
        </span>
        <div className="ml-auto flex w-full max-w-md items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-fg-subtle)]" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (semanticResults) setSemanticResults(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSemanticSearch();
              }}
              placeholder="Search text, or press Enter for meaning"
              className="pl-9"
            />
          </div>
          {semanticResults ? (
            <Button variant="ghost" size="sm" onClick={onClearSemantic}>
              Clear
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={onSemanticSearch} disabled={semanticLoading || query.trim().length < 2}>
              {semanticLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Meaning
            </Button>
          )}
        </div>
      </div>
      {semanticResults && (
        <p className="mt-2 text-xs text-[color:var(--color-fg-subtle)]">
          Showing {semanticResults.length} semantic matches for <span className="italic">&quot;{query}&quot;</span>, ranked by similarity.
        </p>
      )}

      <div className="mt-5 space-y-3">
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}

        {!loading && filtered.length === 0 && (
          <Card className="p-10 text-center">
            <CardContent className="p-0">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]">
                <CalendarIcon className="h-5 w-5 text-[color:var(--color-fg-muted)]" />
              </div>
              <p className="mt-3 text-sm text-[color:var(--color-fg-muted)]">
                {query ? 'No entries match that search.' : 'Your first entry will live here.'}
              </p>
            </CardContent>
          </Card>
        )}

        {!loading &&
          filtered.map((entry, i) => {
            const mood = MOODS.find((m) => m.label === entry.mood);
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.02 * i }}
              >
                <Card className="group transition-colors hover:border-white/15">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {mood && (
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                            style={{
                              background: `${mood.color}14`,
                              border: `1px solid ${mood.color}40`,
                            }}
                          >
                            {mood.emoji}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium tracking-tight">
                            {formatDateLong(entry.createdAt)}
                          </div>
                          <div className="text-xs text-[color:var(--color-fg-subtle)]">
                            {formatTime(entry.createdAt)}
                            {entry.mood ? <> · <span style={{ color: mood?.color }}>{entry.mood}</span></> : null}
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--color-fg-muted)]">
                      {entry.content}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
      </div>
    </div>
  );
}
