"use client";

import { MemoryProvider, useMemory } from "@/lib/store";
import { Shell } from "@/components/Shell";
import Landing from "@/views/Landing";
import Home from "@/views/Home";
import Scan from "@/views/Scan";
import Rewind from "@/views/Rewind";
import Brief from "@/views/Brief";
import EpisodeView from "@/views/Episode";
import { Logo } from "@/components/ui";

function Router() {
  const { route, ready } = useMemory();
  if (!ready)
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="animate-pulse"><Logo size={44} word={false} /></div>
      </div>
    );
  if (route.name === "landing") return <Landing />;
  const key = route.name === "episode" ? `ep-${route.id}` : route.name === "brief" ? `brief-${route.episodeId ?? ""}` : route.name;
  return (
    <Shell routeKey={key}>
      {route.name === "home" && <Home />}
      {route.name === "scan" && <Scan />}
      {route.name === "rewind" && <Rewind />}
      {route.name === "brief" && <Brief episodeId={route.episodeId} />}
      {route.name === "episode" && <EpisodeView id={route.id} />}
    </Shell>
  );
}

export default function Page() {
  return (
    <MemoryProvider>
      <Router />
    </MemoryProvider>
  );
}
