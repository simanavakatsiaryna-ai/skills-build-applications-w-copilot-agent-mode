import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = { title: string; reason: string };

export default function Workouts() {
  return (
    <CapabilityCard<WorkoutSuggestion>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      endpoint={`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`}
      collection="suggestions"
      emptyMessage="No workout suggestions yet."
      renderItem={(suggestion) => `${suggestion.title} · ${suggestion.reason}`}
    />
  );
}
