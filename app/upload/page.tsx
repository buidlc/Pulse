import { Navbar } from '@frontend/components/nav/Navbar';
import { ExpiryWarning } from '@frontend/components/shared/ExpiryWarning';
import { UploadForm } from '@frontend/components/upload/UploadForm';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function UploadPage() {
  return (
    <main>
      <Navbar />
      <ExpiryWarning />

      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-2 md:gap-0 px-4 md:px-8 py-5 md:py-6 heavy-divider">
        <div>
          <div className="label mb-2">New piece</div>
          <h1 className="display text-[28px] md:text-[42px] tracking-[-1px] md:tracking-[-2px] leading-none">What are you publishing?</h1>
        </div>
        <div className="mono text-[10px] text-muted">Content deploys to Shelby on publish</div>
      </header>

      <UploadForm />
      <div className="mobile-nav-spacer" />
    </main>
  );
}
