import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";

export function useAppStateRefetch(...refetchFns: Array<() => void>) {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const refetchRef = useRef(refetchFns);
  refetchRef.current = refetchFns;

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (appStateRef.current !== "active" && nextState === "active") {
          for (const fn of refetchRef.current) {
            void fn();
          }
        }
        appStateRef.current = nextState;
      },
    );
    return () => subscription.remove();
  }, []);
}
