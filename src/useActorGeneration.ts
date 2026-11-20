import { useEffect, useRef } from "react";

/** Invalidate synchronously on render, so old requests cannot update a new actor's view. */
export function useActorGeneration(actor: string) {
  const state = useRef({ actor, generation: 0, mounted: true });
  if (state.current.actor !== actor) {
    state.current.actor = actor;
    state.current.generation++;
  }
  useEffect(() => {
    state.current.mounted = true;
    return () => {
      state.current.mounted = false;
      state.current.generation++;
    };
  }, []);
  return {
    next: () => ++state.current.generation,
    current: (generation: number) =>
      state.current.mounted && state.current.generation === generation,
  };
}
