import { Navbar } from '@frontend/components/nav/Navbar';

export const metadata = {
  title: 'PULSE — Docs',
};

export default function DocsPage() {
  return (
    <main>
      <Navbar />

      <section className="container-narrow px-4 md:px-8 py-10 md:py-14">
        <div className="label mb-4">Documentation</div>
        <h1 className="display text-[28px] md:text-[40px] leading-[1.1] tracking-[-0.5px] md:tracking-[-1px] text-ink mb-8">
          What PULSE is.
        </h1>

        <p className="mono text-[12px] leading-[1.9] text-subtext mb-6">
          PULSE is a decentralized creator-monetization protocol. Creators publish articles, videos and courses;
          buyers pay for permanent, wallet-native access. Every sale, resale royalty and vote is a signed
          transaction on Shelbynet. No platform account, no password, no central authority can ban a creator,
          remove content or freeze a wallet.
        </p>

        <h2 className="display text-[20px] md:text-[24px] mt-12 mb-3 text-ink">Why it exists.</h2>
        <p className="mono text-[12px] leading-[1.9] text-subtext mb-6">
          Existing creator platforms keep three keys you don&apos;t see: who can publish, who can be paid, and
          which content stays online. Each of those keys can be turned off — by policy, by acquisition, by
          mistake. PULSE replaces all three with on-chain rules anyone can read and no one can override
          unilaterally.
        </p>

        <h2 className="display text-[20px] md:text-[24px] mt-12 mb-3 text-ink">The two layers.</h2>
        <p className="mono text-[12px] leading-[1.9] text-subtext mb-3">
          <span className="text-ink font-medium">Storage</span> lives on Shelby — a decentralized hot-storage
          network. When you publish, the file streams onto Shelby and you receive a permanent blob ID.
        </p>
        <p className="mono text-[12px] leading-[1.9] text-subtext mb-6">
          <span className="text-ink font-medium">Logic</span> lives in a Move smart contract on Shelbynet
          (Shelby&apos;s Aptos-compatible chain). It tracks every piece of content, who owns access tokens,
          which votes have been cast, and how every payment is split.
        </p>

        <h2 className="display text-[20px] md:text-[24px] mt-12 mb-3 text-ink">The economic model.</h2>
        <ul className="mono text-[12px] leading-[1.9] text-subtext mb-6 space-y-2">
          <li>— Creators set their own price in ShelbyUSD.</li>
          <li>— On every primary sale: creator receives 99%, platform receives 1%.</li>
          <li>— Buyers may resell their access token; creator earns a configurable royalty (default 5%) on every resale; platform takes another 1%.</li>
          <li>— Voting costs 0.1 ShelbyUSD per vote. Upvote fee goes to the creator. Downvote fee goes to a community pool.</li>
          <li>— All splits are enforced by the smart contract — there is no off-chain ledger to argue with.</li>
        </ul>

        <h2 className="display text-[20px] md:text-[24px] mt-12 mb-3 text-ink">What a buyer actually owns.</h2>
        <p className="mono text-[12px] leading-[1.9] text-subtext mb-6">
          When you buy a piece on PULSE, your wallet address is added to the access list inside the contract.
          That entry is the access token. It cannot be revoked by the creator, the platform or anyone else. To
          read the content, your browser asks Shelby for the blob; Shelby checks the contract; the contract
          confirms you&apos;re on the list; the file streams down.
        </p>

        <h2 className="display text-[20px] md:text-[24px] mt-12 mb-3 text-ink">Admin and review.</h2>
        <p className="mono text-[12px] leading-[1.9] text-subtext mb-6">
          A single admin wallet — defined at deploy time — can flip content from <em>pending</em> to <em>live</em>,
          flag content that violates platform standards, and propose protocol-fee changes. Fee changes are
          locked behind a 48-hour timelock so a compromised admin wallet cannot drain the platform instantly.
          The admin cannot mint funds, cannot cancel a buyer&apos;s access token, and cannot change a creator&apos;s
          royalty split after publication.
        </p>

        <h2 className="display text-[20px] md:text-[24px] mt-12 mb-3 text-ink">Token + currency.</h2>
        <p className="mono text-[12px] leading-[1.9] text-subtext mb-6">
          Everything settles in ShelbyUSD — the platform&apos;s payment token. You don&apos;t need a separate &quot;PULSE&quot;
          token to use the protocol; ShelbyUSD is the only thing that moves. On testnet, that ShelbyUSD comes from the
          Shelbynet faucet and has no real-world value.
        </p>

        <h2 className="display text-[20px] md:text-[24px] mt-12 mb-3 text-ink">For more.</h2>
        <p className="mono text-[12px] leading-[1.9] text-subtext mb-6">
          See <a href="/how-it-works" className="underline text-ink">How it works</a> for the step-by-step
          protocol flow, or <a href="/ledger" className="underline text-ink">the Ledger</a> for the live
          on-chain catalog.
        </p>
      </section>

      <div className="mobile-nav-spacer" />
    </main>
  );
}
