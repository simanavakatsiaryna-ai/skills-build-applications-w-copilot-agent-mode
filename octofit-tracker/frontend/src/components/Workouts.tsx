import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = { title: string; reason: string };
type WorkoutSuggestionsResponse = { suggestions: WorkoutSuggestion[] };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const userEmail = 'mona@example.com';
    getJson<WorkoutSuggestionsResponse>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`)
      .then((response) => {
        if (!Array.isArray(response.suggestions)) throw new Error('The server returned an unexpected response.');
        if (!cancelled) setSuggestions(response.suggestions);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : 'Unable to load data.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CapabilityCard<WorkoutSuggestion>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      items={suggestions}
      error={error}
      emptyMessage="No workout suggestions yet."
      renderItem={(suggestion) => `${suggestion.title} · ${suggestion.reason}`}
    />
  );
}
