'use client';

import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import type { PlatformConfig } from '@shared/types';
import {
  buildProposeFeeChangeTx,
  buildExecuteFeeChangeTx,
  buildSetVoteCostTx,
  buildSetAutoflagTx,
} from '@shared/lib/contracts';
import { aptos, octasToApt, aptToOctas } from '@shared/lib/aptos';

interface Props {
  config: PlatformConfig | null;
  onChange?: () => void;
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <div className="toggle-track" data-on={on} onClick={onChange}>
      <div className="toggle-knob" />
    </div>
  );
}

export function ProtocolSettings({ config, onChange }: Props) {
  const { signAndSubmitTransaction } = useWallet();
  const [feePct, setFeePct] = useState(config ? (config.feeBps / 100).toString() : '1');
  const [voteCostApt, setVoteCostApt] = useState(config ? octasToApt(config.voteCost).toString() : '0.1');
  const [autoflag, setAutoflag] = useState(config?.autoflagEnabled ?? true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!config) {
    return <div className="px-4 md:px-6 py-8 mono text-[10px] text-muted">Contract not yet initialized.</div>;
  }

  const submit = async (
    label: string,
    txBuilder: () =>
      | ReturnType<typeof buildProposeFeeChangeTx>
      | ReturnType<typeof buildExecuteFeeChangeTx>
      | ReturnType<typeof buildSetVoteCostTx>
      | ReturnType<typeof buildSetAutoflagTx>,
  ) => {
    setError(null);
    setBusy(label);
    try {
      const tx = txBuilder();
      const r = await signAndSubmitTransaction(tx);
      const hash = r.hash ?? r.txnHash ?? '';
      if (hash) await aptos.waitForTransaction({ transactionHash: hash });
      onChange?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="px-4 md:px-6 py-2">
      <div className="label py-4">Protocol settings</div>

      <div className="flex justify-between items-center py-4 row-divider">
        <div>
          <div className="text-[12px] font-medium">Platform fee</div>
          <div className="mono text-[10px] text-muted mt-1">
            Changes are timelocked for 48 hours. Cap: 10%.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={feePct}
            onChange={(e) => setFeePct(e.target.value)}
            className="w-12 border-0 mono text-[14px] font-medium text-center bg-transparent"
          />
          <span className="text-[12px] text-muted">%</span>
          <button
            disabled={busy !== null}
            onClick={() => submit('fee', () => buildProposeFeeChangeTx(Math.round(parseFloat(feePct) * 100)))}
            className="btn-small"
          >
            {busy === 'fee' ? '…' : 'Propose'}
          </button>
          {config.hasPendingFeeChange && (
            <button
              disabled={busy !== null}
              onClick={() => submit('exec', () => buildExecuteFeeChangeTx())}
              className="btn-small"
            >
              {busy === 'exec' ? '…' : 'Execute'}
            </button>
          )}
        </div>
      </div>
      {config.hasPendingFeeChange && (
        <div className="mono text-[10px] text-muted -mt-2 mb-3">
          Pending: {(config.pendingFeeBps / 100).toFixed(2)}% — executable at{' '}
          {new Date(config.feeChangeAt * 1000).toLocaleString()}
        </div>
      )}

      <div className="flex justify-between items-center py-4 row-divider">
        <div>
          <div className="text-[12px] font-medium">Vote cost</div>
          <div className="mono text-[10px] text-muted mt-1">Charged on every vote tx.</div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            value={voteCostApt}
            onChange={(e) => setVoteCostApt(e.target.value)}
            className="w-16 border-0 mono text-[14px] font-medium text-center bg-transparent"
          />
          <span className="text-[12px] text-muted">ShelbyUSD</span>
          <button
            disabled={busy !== null}
            onClick={() => submit('vc', () => buildSetVoteCostTx(aptToOctas(parseFloat(voteCostApt))))}
            className="btn-small"
          >
            {busy === 'vc' ? '…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center py-4 row-divider">
        <div>
          <div className="text-[12px] font-medium">Require admin approval before content goes live</div>
          <div className="mono text-[10px] text-muted mt-1">
            Locked ON in this build. Disable only by editing the contract.
          </div>
        </div>
        <Toggle on={true} onChange={() => undefined} />
      </div>

      <div className="flex justify-between items-center py-4 row-divider">
        <div>
          <div className="text-[12px] font-medium">Auto-flag on 5+ downvotes</div>
          <div className="mono text-[10px] text-muted mt-1">Off-chain pause until reviewed.</div>
        </div>
        <div className="flex items-center gap-3">
          <Toggle on={autoflag} onChange={() => setAutoflag((v) => !v)} />
          <button
            disabled={busy !== null}
            onClick={() => submit('af', () => buildSetAutoflagTx(autoflag))}
            className="btn-small"
          >
            {busy === 'af' ? '…' : 'Save'}
          </button>
        </div>
      </div>

      {error && <div className="mono text-[10px] text-ink mt-3">{error}</div>}
    </section>
  );
}
