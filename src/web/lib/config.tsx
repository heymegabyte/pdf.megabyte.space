import { createContext, useContext, useEffect, useState } from "react";
import { initAnalytics } from "./analytics";

export interface AppConfig {
  appName: string;
  appUrl: string;
  googleSignInEnabled: boolean;
  billingEnabled: boolean;
  unlimitedEnabled: boolean;
  proPriceUsd: number;
  unlimitedPriceUsd: number;
  freeLimit: number;
  paidLimit: number;
  sentryDsn: string;
  posthogKey: string;
  posthogHost: string;
  gtmId: string;
  ga4Id: string;
}

// undefined = loading | null = fetch failed / not configured | AppConfig = loaded
const ConfigCtx = createContext<AppConfig | null | undefined>(undefined);

async function fetchConfig(retries = 3): Promise<AppConfig> {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch("/api/config");
      if (r.ok) return r.json() as Promise<AppConfig>;
    } catch {
      // network error — retry
    }
    if (i < retries - 1) await new Promise((res) => setTimeout(res, 800 * 2 ** i));
  }
  throw new Error("config unavailable");
}

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig | null | undefined>(undefined);
  useEffect(() => {
    fetchConfig()
      .then((cfg) => {
        setConfig(cfg);
        const schedule =
          (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void })
            .requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1));
        schedule(() => initAnalytics(cfg), { timeout: 3000 });
      })
      .catch(() => setConfig(null));
  }, []);
  return <ConfigCtx.Provider value={config}>{children}</ConfigCtx.Provider>;
}

export function useConfig() {
  return useContext(ConfigCtx);
}
