import { Navbar } from '@frontend/components/nav/Navbar';

export const metadata = {
  title: 'PULSE — How it works',
};

function Step({ n, title, body }: { n: string; title: string; body: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[44px_1fr] md:grid-cols-[60px_1fr] gap-4 md:gap-6 py-5 md:py-6">
      <div className="display text-[28px] md:text-[36px] leading-none text-ink">{n}</div>
      <div>
        <div className="display text-[16px] md:text-[20px] mb-2 text-ink">{title}</div>
        <div className="mono text-[12px] leading-[1.9] text-subtext">{body}</div>
      </div>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <main>
      <Navbar />

      <section className="container-narrow px-4 md:px-8 py-10 md:py-14">
        <div className="label mb-4">How it works</div>
        <h1 className="display text-[28px] md:text-[40px] leading-[1.1] tracking-[-0.5px] md:tracking-[-1px] text-ink mb-10">
          The full protocol flow.
        </h1>

        <p className="mono text-[12px] leading-[1.9] text-subtext mb-10">
          PULSE has two players: a creator publishing content, and a buyer paying for access. Everything
          between them runs on a Move smart contract that anyone can read, and on Shelby&apos;s decentralized
          storage network. Here is what each transaction actually does.
        </p>

        <div id="before-you-start" className="label mt-10 mb-2 scroll-mt-20">Before you start — get test ShelbyUSD</div>

        <div className="bg-hover p-5 md:p-6 mb-10">
          <p className="mono text-[12px] leading-[1.9] text-subtext mb-4">
            Every action on PULSE — publishing, buying, voting, reselling — is a signed Shelbynet
            transaction, and each one costs a tiny amount of ShelbyUSD for gas. On testnet, that ShelbyUSD is free.
            There&apos;s no website to visit; you fund your wallet through one of these two paths.
          </p>

          <div className="display text-[14px] md:text-[16px] mb-2 text-ink mt-4">Option A — From Petra (easiest)</div>
          <ol className="mono text-[12px] leading-[1.9] text-subtext mb-4 space-y-1">
            <li>1. Open the Petra extension.</li>
            <li>2. Switch network to <span className="text-ink">Shelbynet</span> (Settings → Network).</li>
            <li>3. Tap the <span className="text-ink">Faucet</span> button on your account screen — you&apos;ll receive 10 ShelbyUSD instantly.</li>
          </ol>

          <div className="display text-[14px] md:text-[16px] mb-2 text-ink mt-4">Option B — From the Aptos CLI</div>
          <p className="mono text-[12px] leading-[1.9] text-subtext mb-2">
            If you have the CLI installed and your account configured for Shelbynet:
          </p>
          <pre className="bg-faint px-3 py-3 text-[11px] leading-[1.8] text-ink overflow-x-auto whitespace-pre-wrap mb-2">aptos account fund-with-faucet \
  --account &lt;your-address&gt; \
  --faucet-url https://faucet.shelbynet.shelby.xyz</pre>

          <p className="mono text-[11px] leading-[1.9] text-muted mt-3">
            The faucet endpoint itself is an API only — opening{' '}
            <span className="text-ink">faucet.shelbynet.shelby.xyz</span> in a browser shows nothing useful.
            Always go through Petra or the CLI.
          </p>
        </div>

        <div className="label mt-12 mb-2">Publishing</div>

        <Step
          n="01"
          title="Creator uploads to Shelby"
          body="The creator picks a file (article, video or course bundle), the browser sends it to Shelby. Shelby returns a permanent blob ID — a permanent pointer that no central server can revoke."
        />
        <Step
          n="02"
          title="Creator signs publish_content"
          body="A single Move transaction registers the blob ID, title, type, price (in ShelbyUSD) and royalty percentage on Shelbynet. The creator pays gas. The content enters the pending queue."
        />
        <Step
          n="03"
          title="Admin approves"
          body="An admin wallet calls set_content_active. The content flips from pending to live, and shows up in the Ledger and homepage. This is the only gatekeeping moment."
        />

        <div className="label mt-12 mb-2">Buying</div>

        <Step
          n="04"
          title="Buyer signs purchase_access"
          body={
            <>
              Buyer&apos;s wallet pays the asking price in ShelbyUSD. The contract splits it: 99% to the creator,
              1% to the platform — atomically, in a single transaction. The buyer&apos;s address is added to
              the content&apos;s access list.
            </>
          }
        />
        <Step
          n="05"
          title="Content streams from Shelby"
          body="On the next page load, the browser asks Shelby for the blob. Shelby checks the contract; the contract confirms the buyer&apos;s address is on the access list; the file streams down. No login, no API key, no platform server in between."
        />

        <div className="label mt-12 mb-2">Voting</div>

        <Step
          n="06"
          title="Verified buyer signs cast_vote"
          body="Only wallets holding access can vote. The transaction costs 0.1 ShelbyUSD. Upvote? The 0.1 ShelbyUSD goes to the creator as a tip. Downvote? It goes to a community pool. The vote count updates instantly on chain."
        />

        <div className="label mt-12 mb-2">Reselling</div>

        <Step
          n="07"
          title="Resale with automatic royalty"
          body="A buyer who owns access can resell it to a new buyer. The contract enforces the split: creator gets the royalty (default 5%), platform gets 1%, original seller gets the rest. The access token transfers; the original seller loses it. No middleman."
        />

        <div className="label mt-12 mb-2">Why this matters</div>

        <p className="mono text-[12px] leading-[1.9] text-subtext mb-6">
          Everything described above is a Move function in the contract at <span className="text-ink">platform.move</span>.
          You don&apos;t take our word for it — you can read the code, simulate any transaction and verify
          every payment split before signing. The platform&apos;s only privilege is approving content. Funds
          never sit in a custodial wallet — they move directly from buyer to creator.
        </p>
      </section>

      <div className="mobile-nav-spacer" />
    </main>
  );
}
