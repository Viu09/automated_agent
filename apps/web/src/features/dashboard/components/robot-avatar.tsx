import type { AccentColor, AgentFamily } from "../types";

export function RobotAvatar({
  family,
  accent,
  large = false,
}: {
  family: AgentFamily;
  accent: AccentColor;
  large?: boolean;
}) {
  return (
    <div className={`avatar-shell ${large ? "avatar-large" : ""} accent-${accent} family-${family}`}>
      <div className="avatar-orbit orbit-one" />
      <div className="avatar-orbit orbit-two" />
      <div className="avatar-orbit orbit-three" />
      <div className="avatar-bot">
        <div className="avatar-head">
          <span className="avatar-eye left" />
          <span className="avatar-eye right" />
        </div>
        <div className="avatar-torso" />
        <div className="avatar-core" />
      </div>
    </div>
  );
}
