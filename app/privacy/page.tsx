import { Navbar } from '@frontend/components/nav/Navbar';

export const metadata = {
  title: 'PULSE — Privacy',
};

export default function PrivacyPage() {
  return (
    <main>
      <Navbar />

      <section className="container-narrow px-4 md:px-8 py-10 md:py-14">
        <div className="label mb-4">Privacy</div>
        <h1 className="display text-[26px] md:text-[36px] leading-[1.1] tracking-[-0.5px] md:tracking-[-1px] text-ink mb-8">
          What we collect — and what we don&apos;t.
        </h1>

        <p className="mono text-[12px] leading-[1.9] text-subtext mb-6">
          PULSE is wallet-only. There is no account, no email signup, no password. We never collect your
          name, address, phone number, biometric data or government ID.
        </p>

        <h2 className="display text-[18px] md:text-[22px] mt-10 mb-3 text-ink">What is publicly recorded on chain</h2>
        <ul className="mono text-[12px] leading-[1.9] text-subtext mb-6 space-y-2">
          <li>— Your wallet address (whenever you publish, buy, vote, or resell).</li>
          <li>— Every transaction signature you submit (creates an immutable, public record on Shelbynet).</li>
          <li>— Content blob IDs you publish, the title and price you set, and the royalty percentage.</li>
          <li>— Vote events (which wallet voted on which content, and whether up or down).</li>
        </ul>
        <p className="mono text-[12px] leading-[1.9] text-subtext mb-6">
          This information is public by design — anyone can read it directly from Shelbynet without going
          through PULSE. We cannot delete it; the chain does not forget.
        </p>

        <h2 className="display text-[18px] md:text-[22px] mt-10 mb-3 text-ink">What we collect on our server</h2>
        <ul className="mono text-[12px] leading-[1.9] text-subtext mb-6 space-y-2">
          <li>— A short-lived (60-second) login nonce, deleted immediately after a successful sign-in.</li>
          <li>— A 2-hour session JWT stored as an HttpOnly cookie in your browser. Never sent to third parties.</li>
          <li>— Rate-limit counters (per wallet and per IP) used only to prevent abuse. Counters expire automatically.</li>
          <li>— Anonymous server logs (IP address, user agent, request path) retained for up to 30 days for security incident response.</li>
        </ul>

        <h2 className="display text-[18px] md:text-[22px] mt-10 mb-3 text-ink">What we do NOT collect</h2>
        <ul className="mono text-[12px] leading-[1.9] text-subtext mb-6 space-y-2">
          <li>— Personal identifiers (name, email, phone).</li>
          <li>— Cookies for advertising or third-party tracking.</li>
          <li>— Any private key, seed phrase, or wallet secret. We can&apos;t see them — Petra never reveals them.</li>
          <li>— Biometric or device-fingerprint data.</li>
        </ul>

        <h2 className="display text-[18px] md:text-[22px] mt-10 mb-3 text-ink">Third parties involved</h2>
        <ul className="mono text-[12px] leading-[1.9] text-subtext mb-6 space-y-2">
          <li>— <span className="text-ink">Shelby</span> — receives the file blobs you upload (publicly readable by design).</li>
          <li>— <span className="text-ink">Shelbynet validators</span> — process every transaction you sign.</li>
          <li>— <span className="text-ink">Cloudflare Turnstile</span> (when configured) — bot-prevention; sees only an opaque token.</li>
          <li>— <span className="text-ink">Upstash Redis</span> — holds nonces and rate-limit counters; sees only your wallet address and request counts.</li>
        </ul>

        <h2 className="display text-[18px] md:text-[22px] mt-10 mb-3 text-ink">Your rights</h2>
        <p className="mono text-[12px] leading-[1.9] text-subtext mb-6">
          You can stop using PULSE at any time. Disconnect your wallet, clear your cookies, and you are gone
          from our server. Your on-chain history will remain — neither we nor anyone else can erase the
          blockchain.
        </p>

        <h2 className="display text-[18px] md:text-[22px] mt-10 mb-3 text-ink">Contact</h2>
        <p className="mono text-[12px] leading-[1.9] text-subtext mb-6">
          For privacy questions, reach the project maintainers. As a decentralized protocol, PULSE has no
          customer-service department; the smart contract is its own enforcement mechanism.
        </p>

        <p className="mono text-[10px] text-muted mt-12">Last updated: 2026-05-02.</p>
      </section>

      <div className="mobile-nav-spacer" />
    </main>
  );
}
