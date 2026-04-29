'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { DistortionResponse } from '@/lib/api';

interface JournalDistortionResultProps {
  distortions: DistortionResponse | null;
  onDismiss: () => void;
}

export function JournalDistortionResult({ distortions, onDismiss }: JournalDistortionResultProps) {
  return (
    <AnimatePresence>
      {distortions && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          className="mt-6"
        >
          <Card className="relative overflow-hidden" style={{ boxShadow: '0 20px 60px -40px #7dd3fc70' }}>
            <div
              aria-hidden
              className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full opacity-30 blur-3xl"
              style={{ background: 'radial-gradient(circle, #7dd3fc, transparent 70%)' }}
            />
            <CardContent className="relative p-6">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(125,211,252,0.15)', color: '#7dd3fc' }}
                >
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold tracking-tight">A gentle CBT check</h3>
                      <p className="text-xs text-[color:var(--color-fg-subtle)]">
                        Not a diagnosis — just a kinder angle on the thoughts underneath.
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={onDismiss}>
                      Dismiss
                    </Button>
                  </div>
                  {(distortions.provider === 'on-device' || distortions.provider === 'local') && (
                    <div
                      className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-300/5 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-200/90"
                      title={
                        distortions.provider === 'on-device'
                          ? 'This analysis ran entirely in your browser. Your words did not leave your device.'
                          : 'This analysis ran on our own servers — no third-party AI vendor saw your words.'
                      }
                    >
                      <span
                        aria-hidden
                        className="h-1.5 w-1.5 rounded-full bg-emerald-300"
                      />
                      {distortions.provider === 'on-device' ? 'Private · on your device' : 'Private · self-hosted'}
                    </div>
                  )}
                  <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-fg-muted)]">
                    {distortions.summary}
                  </p>
                  {distortions.degraded && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-200/90">
                      <span className="mt-[2px]">⚠</span>
                      <span>
                        {distortions.degradedReason === 'ai_unavailable'
                          ? 'The AI companion is briefly resting — I fell back to a simpler keyword-based reading. Results are lighter than usual.'
                          : 'I had trouble reading this through the full AI lens just now, so I\'m showing a simpler keyword-based reading. Try again in a moment for a deeper pass.'}
                      </span>
                    </div>
                  )}
                  {distortions.distortions.length === 0 ? (
                    <p className="mt-3 text-sm text-[color:var(--color-fg-muted)]">
                      {distortions.degraded
                        ? 'Nothing jumped out through the simpler reading — the full AI check may find more.'
                        : 'No strong distortion patterns detected. Keep writing — clarity often comes slowly.'}
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {distortions.distortions.map((d, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                        >
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                            {d.label.replace(/_/g, ' ')}
                          </Badge>
                          <p className="mt-2 text-xs text-[color:var(--color-fg-subtle)]">
                            You wrote: <span className="italic">&quot;{d.evidence}&quot;</span>
                          </p>
                          <p className="mt-2 text-sm leading-relaxed">{d.reframe}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
