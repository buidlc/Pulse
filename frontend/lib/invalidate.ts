export async function invalidateHome(extraPaths: string[] = []): Promise<void> {
  const paths = ['/', '/ledger', ...extraPaths];
  try {
    await fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths }),
      keepalive: true,
    });
  } catch {}
}
