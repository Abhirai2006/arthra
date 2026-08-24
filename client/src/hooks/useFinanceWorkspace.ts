import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";

export function useFinanceWorkspace() {
  const bootstrap = trpc.finance.bootstrap.useQuery(undefined, { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 });
  const [activeSpaceId, setActiveSpaceId] = useState<number | null>(null);

  useEffect(() => {
    const availableSpaces = bootstrap.data?.spaces;
    if (!availableSpaces?.length) return;
    setActiveSpaceId(current => {
      if (current && availableSpaces.some(space => space.id === current)) return current;
      const stored = Number(localStorage.getItem("arthra-active-space"));
      return availableSpaces.some(space => space.id === stored) ? stored : availableSpaces[0].id;
    });
  }, [bootstrap.data?.spaces]);

  function selectSpace(spaceId: number) {
    localStorage.setItem("arthra-active-space", String(spaceId));
    setActiveSpaceId(spaceId);
  }

  return { ...bootstrap, activeSpaceId, setActiveSpaceId: selectSpace, activeSpace: bootstrap.data?.spaces.find(space => space.id === activeSpaceId) ?? null, spaces: bootstrap.data?.spaces ?? [], categories: bootstrap.data?.categories ?? [] };
}
