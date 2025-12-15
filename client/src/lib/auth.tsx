import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { User } from "@shared/schema";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  login: (token?: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Util: leitura segura do localStorage (evita crashes em ambientes limitados)
function safeGetItem(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSetItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}
function safeRemoveItem(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

/**
 * Estratégia:
 * - Primeiro tenta restaurar com Bearer token do localStorage.
 * - Se não houver token, tenta cookie de sessão com credentials: 'include' (opcional).
 * - Nunca deixa isLoading travado; sempre finaliza.
 * - login(token?): se token for fornecido, salva e busca /me com Authorization.
 *   Se não for fornecido, tenta via cookie (credentials: 'include').
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const bootstrapped = useRef(false);

  const restoreWithToken = async (token: string) => {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Falha ao restaurar sessão com token");
    const data = await res.json();
    setUser(data);
  };

  const restoreWithCookie = async () => {
    // Caso backend use cookie httpOnly, incluir credentials
    const res = await fetch("/api/auth/me", {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Falha ao restaurar sessão com cookie");
    const data = await res.json();
    setUser(data);
  };

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    (async () => {
      try {
        const token = safeGetItem("authToken");
        if (token) {
          await restoreWithToken(token);
        } else {
          // fallback para cookie (caso sua API esteja configurada assim)
          await restoreWithCookie();
        }
        setError(null);
      } catch (err: any) {
        setError(err);
        // se falhou com token, remove para não travar
        safeRemoveItem("authToken");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (token?: string) => {
    setIsLoading(true);
    try {
      if (token) {
        safeSetItem("authToken", token);
        await restoreWithToken(token);
      } else {
        // login sem token explícito (ex.: backend setou cookie)
        await restoreWithCookie();
      }
      setError(null);
    } catch (err: any) {
      setError(err);
      if (token) safeRemoveItem("authToken");
      setUser(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    safeRemoveItem("authToken");
    setUser(null);
    setError(null);
    // Opcional: chamadas para invalidar sessão no backend com credentials
    // fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
  };

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      error,
      login,
      logout,
    }),
    [user, isLoading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return ctx;
};
