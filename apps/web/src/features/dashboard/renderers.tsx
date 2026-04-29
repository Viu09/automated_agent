import type { AgentRunRead } from "@/types/api";

import { EmptyState } from "./components/empty-state";
import type { DisplayCard } from "./types";

export function renderAgentCardBody(card: DisplayCard, run: AgentRunRead | null, config: Record<string, string>) {
  const result = run?.results?.[0]?.content ?? {};

  if (card.family === "weather") {
    if (!run) {
      return (
        <EmptyState
          subtitle={config.location_label ? `Lieu configure: ${config.location_label}` : "Configurez une ville puis lancez l'agent."}
          title="Aucune mesure meteo"
        />
      );
    }

    const conditions = (result.conditions as Record<string, unknown> | undefined) ?? {};
    const temperature = conditions.temperature_c;
    const rain = conditions.precipitation_mm;
    const wind = conditions.wind_speed_kmh;
    const label = config.location_label || String(result.location_label ?? "Paris, France");

    return (
      <>
        <div className="hero-metric">
          <strong>{temperature !== undefined ? `${temperature}°C` : "N/A"}</strong>
          <span>{label}</span>
        </div>
        <div className="mini-insights">
          {typeof result.recommendation === "string" ? <span>{result.recommendation}</span> : null}
          <span>{rain !== undefined ? `${rain} mm pluie` : "Pluie indisponible"}</span>
          <span>{wind !== undefined ? `${wind} km/h vent` : "Vent indisponible"}</span>
        </div>
      </>
    );
  }

  if (card.family === "news") {
    const headlines = Array.isArray(result.headlines) ? result.headlines : [];
    if (headlines.length === 0) {
      return (
        <EmptyState
          subtitle={config.topic ? `Topic configure: ${config.topic}` : "Renseignez un topic puis lancez l'agent."}
          title="Aucun article disponible"
        />
      );
    }

    return (
      <div className="bullet-feed">
        {headlines.slice(0, 3).map((headline, index) => {
          const item = headline as Record<string, unknown>;
          const title = String(item.title ?? "Headline");
          const url = typeof item.url === "string" ? item.url : null;

          return url ? (
            <a href={url} key={`${card.key}-${index}`} rel="noreferrer" target="_blank">
              {title}
            </a>
          ) : (
            <span key={`${card.key}-${index}`}>{title}</span>
          );
        })}
      </div>
    );
  }

  if (card.family === "productivity") {
    if (!run) {
      const repoLabel = config.owner && config.repo ? `${config.owner}/${config.repo}` : "Aucun depot configure";
      return <EmptyState subtitle={repoLabel} title="Aucune synchronisation GitHub" />;
    }

    const openIssues = typeof result.open_issues === "number" ? result.open_issues : 0;
    const ratio = Math.min(openIssues * 8, 100);
    const repo = typeof result.repository === "string"
      ? result.repository
      : config.owner && config.repo
        ? `${config.owner}/${config.repo}`
        : "Depot inconnu";

    return (
      <>
        <div className="metric-caption">{repo}</div>
        <span className="metric-note">{typeof result.focus === "string" ? result.focus : "Aucun focus extrait pour le moment."}</span>
        <div className="progress-pair">
          <div className="progress-track">
            <div className="progress-value" style={{ width: `${ratio}%` }} />
          </div>
          <strong>{Math.round(ratio)}%</strong>
        </div>
      </>
    );
  }

  return (
    <EmptyState
      subtitle="Ce module est visible dans le cockpit mais n'a pas encore de source reelle."
      title="Aucune donnee connectee"
    />
  );
}

export function renderCompactControls(
  card: DisplayCard,
  config: Record<string, string>,
  onChange: (agentKey: string, field: string, value: string) => void,
) {
  if (card.key === "weather") {
    return (
      <>
        <input className="mini-input" onChange={(event) => onChange(card.key, "location_label", event.target.value)} placeholder="Ville" type="text" value={config.location_label ?? ""} />
        <input className="mini-input" onChange={(event) => onChange(card.key, "latitude", event.target.value)} placeholder="Lat" type="text" value={config.latitude ?? ""} />
        <input className="mini-input" onChange={(event) => onChange(card.key, "longitude", event.target.value)} placeholder="Lon" type="text" value={config.longitude ?? ""} />
      </>
    );
  }

  if (card.key === "news") {
    return <input className="mini-input" onChange={(event) => onChange(card.key, "topic", event.target.value)} placeholder="Topic" type="text" value={config.topic ?? ""} />;
  }

  if (card.key === "productivity") {
    return (
      <>
        <input className="mini-input" onChange={(event) => onChange(card.key, "owner", event.target.value)} placeholder="Owner" type="text" value={config.owner ?? ""} />
        <input className="mini-input" onChange={(event) => onChange(card.key, "repo", event.target.value)} placeholder="Repo" type="text" value={config.repo ?? ""} />
      </>
    );
  }

  return null;
}
