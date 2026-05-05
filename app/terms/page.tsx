import { Navbar } from '@frontend/components/nav/Navbar';

export const metadata = {
  title: 'PULSE — Terms',
};

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="display text-[18px] md:text-[22px] mt-10 mb-3 text-ink">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mono text-[12px] leading-[1.9] text-subtext mb-6">{children}</p>;
}

export default function TermsPage() {
  return (
    <main>
      <Navbar />

      <section className="container-narrow px-4 md:px-8 py-10 md:py-14">
        <div className="label mb-4">Terms of use</div>
        <h1 className="display text-[26px] md:text-[36px] leading-[1.1] tracking-[-0.5px] md:tracking-[-1px] text-ink mb-8">
          The rules, plainly.
        </h1>

        <P>
          By connecting a wallet to PULSE, you agree to the terms below. PULSE is a decentralized protocol —
          most of the rules are enforced by the smart contract itself, not by a company.
        </P>

        <H2>1. What PULSE is, and isn&apos;t</H2>
        <P>
          PULSE is open-source software that lets creators sell digital content on Shelbynet. It is
          <em> not</em> a custodian — it never holds your funds, your private key, or your content. All payments
          settle directly between buyer and creator wallets. Content is stored on Shelby, not on our servers.
        </P>

        <H2>2. Who can use it</H2>
        <P>
          You must be at least 18 years old. You must control the wallet you connect. You may not use PULSE
          if you are sanctioned under any applicable law or located in a jurisdiction where this kind of
          protocol is prohibited.
        </P>

        <H2>3. Content rules for creators</H2>
        <P>
          You may not publish: child sexual abuse material; non-consensual intimate imagery; content that
          incites real-world violence; content that infringes someone else&apos;s copyright, trademark or
          identity; malware, phishing, or fraud. Violations may be flagged or removed (set to inactive) by the
          admin via the on-chain <span className="text-ink">set_content_active</span> function.
        </P>
        <P>
          What we cannot do: delete the underlying blob from Shelby, refund a sale on your behalf, or stop
          someone from re-publishing your work elsewhere on the network. By publishing, you accept this
          permanence.
        </P>

        <H2>4. Buyer terms</H2>
        <P>
          When you purchase access, you receive a non-revocable on-chain access token tied to your wallet
          address. Sales are final. The price is paid in ShelbyUSD and split atomically: 99% to the creator, 1% to
          the platform. There are no refunds at the protocol level — neither the creator, the admin nor we
          can reverse a transaction.
        </P>

        <H2>5. Resale + royalties</H2>
        <P>
          If the creator allows resale, you may transfer your access token to a new buyer. The contract
          enforces the royalty split set by the creator at publish time (default 5%) plus the 1% platform
          fee; the rest goes to you. You cannot change the royalty after the fact.
        </P>

        <H2>6. Voting</H2>
        <P>
          Every vote costs 0.1 ShelbyUSD and requires a signed transaction. Upvote tips go to the creator;
          downvote fees go to the community pool. Voting privileges are limited to wallets that own access to
          the content. Five or more downvotes auto-flag a piece for admin review (this can be toggled).
        </P>

        <H2>7. Admin powers</H2>
        <P>
          The admin wallet — defined at deployment — can: approve pending content, deactivate violating
          content, ban specific wallets from publishing/voting, and propose protocol-fee changes (which
          require a 48-hour timelock before they take effect). The admin cannot: mint funds, revoke an
          existing buyer&apos;s access token, retroactively change royalty splits, or transfer custody of any
          wallet.
        </P>

        <H2>8. Risks you accept</H2>
        <P>
          Smart contracts can have bugs. The Move contract powering PULSE has not been independently
          audited; you use it at your own risk. Cryptocurrency values fluctuate. Your wallet is your
          responsibility — losing the private key means losing access to everything bought, sold or
          published from it. Network outages can delay transactions.
        </P>

        <H2>9. No warranties</H2>
        <P>
          PULSE is provided &quot;as is.&quot; No warranties, express or implied. We don&apos;t guarantee
          uptime, content quality, accurate metadata, or absence of bugs. To the maximum extent permitted by
          law, we disclaim liability for any loss — financial, reputational or otherwise — arising from your
          use of the protocol.
        </P>

        <H2>10. Changes to these terms</H2>
        <P>
          These terms may be updated. Material changes will be reflected here with a new &quot;last
          updated&quot; date. Continuing to use PULSE after a change means you accept the new terms.
        </P>

        <p className="mono text-[10px] text-muted mt-12">Last updated: 2026-05-02.</p>
      </section>

      <div className="mobile-nav-spacer" />
    </main>
  );
}
