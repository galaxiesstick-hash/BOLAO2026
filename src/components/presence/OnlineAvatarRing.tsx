"use client";

import { useIsOnline } from "@/components/presence/PresenceProvider";

/**
 * Wraps an avatar and adds a green "online" ring + soft glow when the given
 * user is currently present. Used in the public profile (server component
 * passes the avatar as children).
 */
export default function OnlineAvatarRing({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const online = useIsOnline(userId);
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 99,
        flexShrink: 0,
        boxShadow: online ? "0 0 0 3px #3CAC3B, 0 0 16px rgba(60,172,59,0.55)" : "none",
        transition: "box-shadow 0.3s ease",
      }}
    >
      {children}
      {online && (
        <span
          title="Online agora"
          style={{
            position: "absolute", right: 2, bottom: 2,
            width: 16, height: 16, borderRadius: 99,
            background: "#3CAC3B", border: "2.5px solid #15263f",
            boxShadow: "0 0 8px rgba(60,172,59,0.8)",
          }}
        />
      )}
    </div>
  );
}
