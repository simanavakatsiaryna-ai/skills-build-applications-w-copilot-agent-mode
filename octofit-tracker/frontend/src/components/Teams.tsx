import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; members: string[] };
type TeamsResponse = { teams: Team[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getJson<TeamsResponse>('/api/teams')
      .then((response) => {
        if (!Array.isArray(response.teams)) throw new Error('The server returned an unexpected response.');
        if (!cancelled) setTeams(response.teams);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : 'Unable to load data.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CapabilityCard<Team>
      title="Teams"
      description="Manage teams and members."
      items={teams}
      error={error}
      emptyMessage="No teams yet."
      renderItem={(team) => `${team.name} · ${team.members.length} members`}
    />
  );
}
