import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type: string; minutes: number; points: number };
type ActivitiesResponse = { activities: Activity[] };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getJson<ActivitiesResponse>('/api/activities')
      .then((response) => {
        if (!Array.isArray(response.activities)) throw new Error('The server returned an unexpected response.');
        if (!cancelled) setActivities(response.activities);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : 'Unable to load data.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CapabilityCard<Activity>
      title="Activities"
      description="Track student activity minutes and points."
      items={activities}
      error={error}
      emptyMessage="No activities yet."
      renderItem={(activity) => `${activity.type} · ${activity.minutes} minutes · ${activity.points} points`}
    />
  );
}
