"use client";

import {
  useHocuspocusAwareness,
  useHocuspocusConnectionStatus,
  useHocuspocusProvider,
  useHocuspocusSyncStatus,
} from "@hocuspocus/provider-react";

function nestedUser(user: Record<string, unknown>) {
  const nested = user.user as { name?: string; color?: string } | undefined;
  return {
    name: nested?.name ?? (typeof user.name === "string" ? user.name : "Someone"),
    color:
      nested?.color ??
      (typeof user.color === "string" ? user.color : "#78716c"),
  };
}

export function PresenceBar() {
  const provider = useHocuspocusProvider();
  const users = useHocuspocusAwareness();
  const status = useHocuspocusConnectionStatus();
  const sync = useHocuspocusSyncStatus();
  const localId = provider.awareness?.clientID;
  const others = users.filter((user) => user.clientId !== localId);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs tracking-wide text-stone-500 uppercase">
        {status === "connected"
          ? sync === "syncing"
            ? "Syncing"
            : "Live"
          : status === "connecting"
            ? "Connecting"
            : "Offline"}
      </span>
      <div className="flex -space-x-2">
        {others.map((user) => {
          const info = nestedUser(user);
          return (
            <span
              key={user.clientId}
              title={info.name}
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--paper)] text-[11px] font-semibold text-white"
              style={{ backgroundColor: info.color }}
            >
              {info.name.slice(0, 1)}
            </span>
          );
        })}
      </div>
      {others.length === 0 ? (
        <span className="text-xs text-stone-500">Only you</span>
      ) : null}
    </div>
  );
}
