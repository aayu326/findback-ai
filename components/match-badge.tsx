import { Sparkles } from 'lucide-react';
export const MatchBadge = ({ score }: { score: number }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 ring-1 ring-blue-200">
    <Sparkles className="h-3.5 w-3.5" /> Potential Match — {Math.round(score)}% AI Match Score
  </span>
);
export const ScoreDisclaimer = () => (
  <p className="text-xs text-muted-foreground">
    The AI score is only a similarity signal. It is <b>not proof of ownership</b> — an organization admin verifies every claim.
  </p>
);
