import type { DashboardIconName } from "../types";

export function IconGlyph({ name }: { name: DashboardIconName }) {
  return (
    <span className="icon-glyph" data-icon={name}>
      <svg aria-hidden="true" viewBox="0 0 24 24">
        {renderIconPath(name)}
      </svg>
    </span>
  );
}

function renderIconPath(name: DashboardIconName) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.7",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "home":
      return <path {...common} d="M3 11.5 12 4l9 7.5M6.5 10.5V20h11v-9.5M10 20v-5h4v5" />;
    case "agents":
      return (
        <>
          <circle {...common} cx="8" cy="9" r="3" />
          <circle {...common} cx="16.5" cy="8.5" r="2.5" />
          <path {...common} d="M4 19c.8-2.7 2.9-4 6-4s5.2 1.3 6 4M14.5 18.5c.5-1.8 1.9-2.8 4-3.1" />
        </>
      );
    case "scenario":
      return (
        <>
          <path {...common} d="M5 6h5v5H5zM14 13h5v5h-5z" />
          <path {...common} d="M10 8.5h4m-2 0v4" />
          <path {...common} d="M12 13v-2.5c0-1.1.9-2 2-2h0" />
        </>
      );
    case "boards":
      return (
        <>
          <rect {...common} x="4" y="5" width="7" height="6" rx="1.5" />
          <rect {...common} x="13" y="5" width="7" height="4" rx="1.5" />
          <rect {...common} x="13" y="11" width="7" height="8" rx="1.5" />
          <rect {...common} x="4" y="13" width="7" height="6" rx="1.5" />
        </>
      );
    case "database":
      return (
        <>
          <ellipse {...common} cx="12" cy="6" rx="7" ry="3" />
          <path {...common} d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
        </>
      );
    case "calendar":
    case "agenda":
      return (
        <>
          <rect {...common} x="4" y="5" width="16" height="15" rx="2" />
          <path {...common} d="M8 3v4M16 3v4M4 9h16" />
        </>
      );
    case "message":
      return <path {...common} d="M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 3v-5H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />;
    case "automation":
    case "settings":
      return (
        <>
          <circle {...common} cx="12" cy="12" r="3" />
          <path {...common} d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 0 1-4 0v-.2a1 1 0 0 0-.7-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 0 1 0-4h.2a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2H9a1 1 0 0 0 .6-.9V4a2 2 0 0 1 4 0v.2a1 1 0 0 0 .7.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1v.1a1 1 0 0 0 .9.6H20a2 2 0 0 1 0 4h-.2a1 1 0 0 0-.4 1.5Z" />
        </>
      );
    case "integration":
      return (
        <>
          <path {...common} d="M8 7a3 3 0 1 1 0 6H5M16 17a3 3 0 1 1 0-6h3M8 10h8M10 14h4" />
        </>
      );
    case "weather":
      return (
        <>
          <path {...common} d="M7 17h9a4 4 0 0 0 .3-8A5 5 0 0 0 6.4 9.8 3.5 3.5 0 0 0 7 17Z" />
          <path {...common} d="m10 18-1 2m4-2-1 2m4-2-1 2M12 4v2M5.6 6.6 7 8m10-1.4L15.6 8M4 12h2m12 0h2" />
        </>
      );
    case "news":
      return (
        <>
          <rect {...common} x="4" y="5" width="16" height="14" rx="2" />
          <path {...common} d="M8 9h8M8 13h5M6.5 9h.01M6.5 13h.01" />
        </>
      );
    case "productivity":
      return (
        <>
          <path {...common} d="M12 3v18M6 12l6-9 6 9M6 12l6 9 6-9" />
        </>
      );
    case "project":
      return (
        <>
          <rect {...common} x="4" y="6" width="16" height="12" rx="2" />
          <path {...common} d="M8 6V4h8v2M8 12h3M8 15h8" />
        </>
      );
    case "health":
      return <path {...common} d="m12 20-1.2-1C6 14.7 3 12 3 8.5A4.5 4.5 0 0 1 7.5 4c1.7 0 3.1.8 4.5 2.3C13.4 4.8 14.8 4 16.5 4A4.5 4.5 0 0 1 21 8.5c0 3.5-3 6.2-7.8 10.5L12 20Z" />;
    case "finance":
      return (
        <>
          <circle {...common} cx="12" cy="12" r="8" />
          <path {...common} d="M12 7v10M15 9.5c0-1-1.3-1.8-3-1.8s-3 .8-3 1.8 1.3 1.8 3 1.8 3 .8 3 1.8-1.3 1.8-3 1.8-3-.8-3-1.8" />
        </>
      );
    case "learning":
      return (
        <>
          <path {...common} d="M4 6.5 12 4l8 2.5v11L12 20l-8-2.5z" />
          <path {...common} d="M12 4v16M8 8.5l4-1 4 1" />
        </>
      );
    case "creative":
      return (
        <>
          <path {...common} d="M12 3c2.8 0 5 2.2 5 5 0 1.8-.9 3-2 4 0 0 0 2 2 2H9c-2 0-2-2-2-2-1.1-1-2-2.2-2-4 0-2.8 2.2-5 5-5h2Z" />
          <path {...common} d="M10 18h4M10.5 21h3" />
        </>
      );
    case "social":
      return (
        <>
          <circle {...common} cx="9" cy="9" r="3" />
          <circle {...common} cx="17" cy="10" r="2.5" />
          <path {...common} d="M4 19c.8-2.7 2.9-4 6-4 1.5 0 2.8.3 3.8.9M14.5 18.5c.7-1.9 2-3 4-3.5" />
        </>
      );
  }
}
