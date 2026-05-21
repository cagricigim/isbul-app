import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  setAuthTokenGetter,
  setBaseUrl,
  type CurrentUser,
} from "@workspace/api-client-react";

const TOKEN_KEY = "isbul.token";
const USER_KEY = "isbul.user";

const apiBaseUrl = (() => {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : "";
})();

setBaseUrl(apiBaseUrl || null);

let cachedToken: string | null = null;
setAuthTokenGetter(async () => {
  if (cachedToken) return cachedToken;
  cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  return cachedToken;
});

export interface AuthState {
  ready: boolean;
  token: string | null;
  user: CurrentUser | null;
}

export interface AuthApi extends AuthState {
  signIn: (token: string, user: CurrentUser) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: CurrentUser | null) => Promise<void>;
}

export const AuthContext = createContext<AuthApi | null>(null);

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth used outside of AuthProvider");
  return ctx;
}

export function useAuthState(): AuthApi {
  const [state, setState] = useState<AuthState>({
    ready: false,
    token: null,
    user: null,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [token, userJson] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);
      cachedToken = token;
      let user: CurrentUser | null = null;
      if (userJson) {
        try {
          user = JSON.parse(userJson) as CurrentUser;
        } catch {
          user = null;
        }
      }
      if (mounted) setState({ ready: true, token, user });
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback(async (token: string, user: CurrentUser) => {
    cachedToken = token;
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    setState({ ready: true, token, user });
  }, []);

  const signOut = useCallback(async () => {
    cachedToken = null;
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setState({ ready: true, token: null, user: null });
  }, []);

  const setUser = useCallback(async (user: CurrentUser | null) => {
    if (user) await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    else await AsyncStorage.removeItem(USER_KEY);
    setState((s) => ({ ...s, user }));
  }, []);

  return useMemo(
    () => ({ ...state, signIn, signOut, setUser }),
    [state, signIn, signOut, setUser],
  );
}

export function imageUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `${apiBaseUrl}${path}`;
}
