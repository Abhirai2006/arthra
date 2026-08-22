import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";

export function useFinanceWorkspace() {
  const bootstrap = trpc.finance.bootstrap.useQuery();
  const [activeSpaceId, setActiveSpaceId] = useState<number | null>(null);

  useEffect(() => {
    if (!bootstrap.data?.spaces.length) return;
    const stored = Number(localStorage.getItem("arthra-active-space"));
    const usable = bootstrap.data.spaces.some(space => space.id === stored) ? stored : bootstrap.data.spaces[0].id;
    setActiveSpaceId(usable);
  }, [bootstrap.data]);

  function selectSpace(spaceId: number) {
    localStorage.setItem("arthra-active-space", String(spaceId));
    setActiveSpaceId(spaceId);
  }

  return { ...bootstrap, activeSpaceId, setActiveSpaceId: selectSpace, activeSpace: bootstrap.data?.spaces.find(space => space.id === activeSpaceId) ?? null, spaces: bootstrap.data?.spaces ?? [], categories: bootstrap.data?.categories ?? [] };
}
