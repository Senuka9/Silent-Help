'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface JournalInsightCardProps {
  insight: string | null;
  insightLoading: boolean;
  onLoad: () => void;
}

export function JournalInsightCard({ insight, insightLoading, onLoad }: JournalInsightCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="mt-6"
    >
      <Card
        className="relative overflow-hidden"
        style={{ boxShadow: `0 20px 60px -40px #a78bfa70` }}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}
            >
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold tracking-tight">Weekly reflection</h3>
                  <p className="text-xs text-[color:var(--color-fg-subtle)]">
                    A private, semantic pattern across your last entries.
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={onLoad} disabled={insightLoading}>
                  {insightLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Reading…
                    </>
                  ) : insight ? (
                    'Refresh'
                  ) : (
                    'Reveal insight'
                  )}
                </Button>
              </div>
              <AnimatePresence>
                {insight && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-3 text-sm leading-relaxed text-[color:var(--color-fg-muted)]"
                  >
                    {insight}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
