'use client';

import { ReactNode, useMemo, Component, type ErrorInfo } from 'react';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { Network } from '@aptos-labs/ts-sdk';

function resolveAdapterNetwork(): Network {
  const n = (process.env.NEXT_PUBLIC_APTOS_NETWORK ?? 'shelbynet').toLowerCase();
  if (n === 'mainnet') return Network.MAINNET;
  if (n === 'devnet') return Network.DEVNET;
  return Network.TESTNET;
}

// Catches render errors anywhere below it so a single throw doesn't blank the
// whole page. Without this, errors during initial render leave the user staring
// at a white screen with no recovery path.
class RootErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; message: string }> {
  state = { hasError: false, message: '' };

  static getDerivedStateFromError(err: Error) {
    return { hasError: true, message: err.message ?? 'Unknown error' };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error('[pulse] root render error', err, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-bg text-ink">
        <div className="max-w-md">
          <div className="display text-[28px] md:text-[36px] tracking-[-1px] mb-3">Something broke.</div>
          <p className="mono text-[12px] text-subtext mb-6">
            The page failed to load. Try refreshing. If the problem persists, your browser may be blocking a
            required script (Brave shields, strict tracking protection, etc.).
          </p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Reload page
          </button>
          <div className="mono text-[10px] text-muted mt-8 break-words">{this.state.message}</div>
        </div>
      </div>
    );
  }
}

export function Providers({ children }: { children: ReactNode }) {
  // Lazy-instantiate inside the component (was at module load — a throw there
  // would break the bundle before React mounts, leaving users with a blank
  // page on Brave-with-shields, Firefox-strict, etc.).
  const wallets = useMemo(() => {
    try {
      return [new PetraWallet()];
    } catch (err) {
      console.warn('[pulse] PetraWallet init failed; wallet features disabled', err);
      return [];
    }
  }, []);

  return (
    <RootErrorBoundary>
      <AptosWalletAdapterProvider
        plugins={wallets}
        autoConnect
        dappConfig={{ network: resolveAdapterNetwork() }}
        onError={(err) => console.error('[pulse] wallet error', err)}
      >
        {children}
      </AptosWalletAdapterProvider>
    </RootErrorBoundary>
  );
}
