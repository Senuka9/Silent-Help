'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BookText } from 'lucide-react';
import { toast } from 'sonner';
import {
  listJournalEntries,
  createJournalEntry,
  getJournalInsight,
  searchJournal,
  detectDistortions,
  type JournalEntry,
  type JournalSearchHit,
  type DistortionResponse,
} from '@/lib/api';
import { recordActivity } from '@/lib/streak';
import { detectDistortionsOnDevice, preloadOnDeviceAi } from '@/lib/on-device-ai';
import { CBT_TO_SERVER, CBT_REFRAMES } from '@/lib/ai-types';
import { Badge } from '@/components/ui/badge';
import { JournalComposer } from '@/components/journal/JournalComposer';
import { JournalInsightCard } from '@/components/journal/JournalInsightCard';
import { JournalDistortionResult } from '@/components/journal/JournalDistortionResult';
import { JournalEntryList } from '@/components/journal/JournalEntryList';

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [distortions, setDistortions] = useState<DistortionResponse | null>(null);
  const [distortionsLoading, setDistortionsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [semanticResults, setSemanticResults] = useState<JournalSearchHit[] | null>(null);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [promptIdx, setPromptIdx] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await listJournalEntries();
        if (active) setEntries(data.entries);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const data = await createJournalEntry(content, selectedMood || undefined);
      setEntries((prev) => [data.entry, ...prev]);
      setContent('');
      setSelectedMood(null);
      recordActivity();
      toast.success('Entry saved', { description: 'A quiet win. Come back anytime.' });
    } catch (err) {
      console.error(err);
      toast.error('Could not save entry');
    } finally {
      setSaving(false);
    }
  };

  const loadInsight = async () => {
    setInsightLoading(true);
    try {
      const res = await getJournalInsight();
      setInsight(res.insight);
    } catch (err) {
      console.error(err);
      toast.error('Insight unavailable right now');
    } finally {
      setInsightLoading(false);
    }
  };

  const analyseDistortions = async () => {
    const trimmed = content.trim();
    if (trimmed.length < 10) {
      toast('Write a little more first', { description: 'I need a few sentences to read the shape of your thoughts.' });
      return;
    }
    setDistortionsLoading(true);
    // Tier 1: try fully on-device first — private AI, text never leaves the browser.
    try {
      const local = await detectDistortionsOnDevice(trimmed, (pct, msg) => {
        if (pct > 0 && pct < 100) {
          toast.loading(`Downloading private AI · ${pct}%`, { id: 'ondevice-load', description: msg });
        } else if (pct >= 100) {
          toast.dismiss('ondevice-load');
        }
      });
      toast.dismiss('ondevice-load');
      const mapped = local.hits.map((h) => {
        const label = CBT_TO_SERVER[h.label];
        return {
          label,
          evidence: trimmed.slice(0, 160),
          reframe: CBT_REFRAMES[label],
        };
      });
      setDistortions({
        summary:
          mapped.length > 0
            ? 'A few familiar thought patterns came through — analysed privately on your device.'
            : 'Nothing strong stood out. That can be a quiet kind of okay.',
        distortions: mapped,
        provider: 'on-device',
        degraded: false,
      });
      setDistortionsLoading(false);
      return;
    } catch (e) {
      toast.dismiss('ondevice-load');
      console.warn('on-device CBT unavailable, falling back to server', e);
    }

    // Tier 2: server (self-hosted local MNLI → cloud LLM → heuristic).
    try {
      const res = await detectDistortions(trimmed);
      setDistortions(res);
    } catch (err) {
      console.error(err);
      toast.error('CBT analysis unavailable right now');
    } finally {
      setDistortionsLoading(false);
    }
  };

  // Warm the on-device model on idle so the first click is fast.
  useEffect(() => {
    preloadOnDeviceAi();
  }, []);

  const filtered = useMemo(() => {
    if (semanticResults) {
      return semanticResults.map((r) => ({
        id: r.id,
        content: r.content,
        mood: r.mood,
        createdAt: r.createdAt,
      })) as JournalEntry[];
    }
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.content.toLowerCase().includes(q) || (e.mood ?? '').toLowerCase().includes(q),
    );
  }, [entries, query, semanticResults]);

  const runSemanticSearch = async () => {
    const q = query.trim();
    if (q.length < 2) return;
    setSemanticLoading(true);
    try {
      const { results } = await searchJournal(q, 10);
      setSemanticResults(results);
      if (results.length === 0) {
        toast('No semantically similar entries yet', { description: 'Keep writing — I will learn your patterns.' });
      }
    } catch (err) {
      console.error(err);
      toast.error('Search unavailable right now');
    } finally {
      setSemanticLoading(false);
    }
  };

  const clearSemantic = () => {
    setSemanticResults(null);
    setQuery('');
  };

  const wordCount = useMemo(() => content.trim().split(/\s+/).filter(Boolean).length, [content]);

  return (
    <div className="mx-auto max-w-4xl px-6 pt-6 sm:px-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Badge variant="outline" className="mb-3">
          <BookText className="h-3.5 w-3.5" />
          Private journal
        </Badge>
        <h1 className="text-balance text-4xl font-semibold tracking-tight">
          Let it out{' '}
          <span className="font-display italic text-[color:var(--color-fg-muted)]">
            — softly, onto the page.
          </span>
        </h1>
        <p className="mt-2 max-w-xl text-[color:var(--color-fg-muted)]">
          Nothing is saved anywhere public. Stream of consciousness is fine. No one is grading this.
        </p>
      </motion.div>

      <JournalComposer
        content={content}
        setContent={setContent}
        selectedMood={selectedMood}
        setSelectedMood={setSelectedMood}
        saving={saving}
        onSave={handleSave}
        distortionsLoading={distortionsLoading}
        onAnalyseDistortions={analyseDistortions}
        wordCount={wordCount}
        promptIdx={promptIdx}
        setPromptIdx={setPromptIdx}
      />

      <JournalInsightCard
        insight={insight}
        insightLoading={insightLoading}
        onLoad={loadInsight}
      />

      <JournalDistortionResult
        distortions={distortions}
        onDismiss={() => setDistortions(null)}
      />

      <JournalEntryList
        entries={entries}
        filtered={filtered}
        loading={loading}
        query={query}
        setQuery={setQuery}
        semanticResults={semanticResults}
        setSemanticResults={setSemanticResults}
        semanticLoading={semanticLoading}
        onSemanticSearch={runSemanticSearch}
        onClearSemantic={clearSemantic}
      />
    </div>
  );
}
