import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getJson<LeaderboardResponse>('/api/leaderboard')
      .then((response) => {
        if (!Array.isArray(response.leaderboard)) throw new Error('The server returned an unexpected response.');
        if (!cancelled) setEntries(response.leaderboard);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : 'Unable to load data.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CapabilityCard<LeaderboardEntry>
      title="Leaderboard"
      description="Compare team point totals."
      items={entries}
      error={error}
      emptyMessage="No leaderboard rankings yet."
      renderItem={(entry) => `#${entry.rank} ${entry.teamName} · ${entry.totalPoints} points`}
    />
  );
}
