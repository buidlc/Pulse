// PULSE — Shelby blob storage wrapper.
//
// The Shelby SDK (@shelby-protocol/sdk) is currently in early access. Until
// the package is installable from your environment this file dynamically
// imports it at runtime and surfaces a clear error if it isn't present.
//
// Sign up: https://developers.shelby.xyz

const SHELBY_RPC = process.env.NEXT_PUBLIC_SHELBY_RPC ?? 'https://api.shelbynet.shelby.xyz/shelby';

let cachedClient: unknown = null;

async function getShelbyClient(): Promise<any> {
  if (cachedClient) return cachedClient;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // @ts-ignore — gated package, not installed until early access granted
    const mod: any = await import(/* webpackIgnore: true */ '@shelby-protocol/sdk/browser');
    const ClientCtor = mod.ShelbyClient ?? mod.default?.ShelbyClient;
    if (!ClientCtor) throw new Error('ShelbyClient export not found in @shelby-protocol/sdk/browser');
    cachedClient = new ClientCtor({
      rpcUrl: SHELBY_RPC,
      apiKey: process.env.NEXT_PUBLIC_APTOS_API_KEY,
    });
    return cachedClient;
  } catch (err) {
    throw new Error(
      'Shelby SDK not installed. Get early access at developers.shelby.xyz, then add @shelby-protocol/sdk to package.json.',
    );
  }
}

export async function uploadBlob(file: File | Blob): Promise<string> {
  const client = await getShelbyClient();
  const blobId: string = await client.write(file);
  return blobId;
}

export async function readBlob(blobId: string): Promise<Blob> {
  const client = await getShelbyClient();
  const blob: Blob = await client.read(blobId);
  return blob;
}

export async function readBlobAsText(blobId: string): Promise<string> {
  const blob = await readBlob(blobId);
  return await blob.text();
}

/**
 * Transcode a video using Shelby's media-prepare kit, then upload. Lazy import
 * mirrors getShelbyClient — package may not be installed yet.
 */
export async function uploadVideo(file: File): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // @ts-ignore — gated package, not installed until early access granted
    const core: any = await import(/* webpackIgnore: true */ '@shelby-protocol/media-prepare/core');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // @ts-ignore — gated package, not installed until early access granted
    const browser: any = await import(/* webpackIgnore: true */ '@shelby-protocol/media-prepare/browser').catch(
      () => null,
    );
    const Builder = core.CmafPlanBuilder;
    const ladderPresets = core.videoLadderPresets;
    if (!Builder || !ladderPresets) throw new Error('media-prepare exports unavailable');
    const plan = new Builder()
      .withInput(file)
      .withVideoLadder(ladderPresets.vodHd_1080p)
      .withHlsOutput()
      .build();

    const Executor = browser?.BrowserCmafPlanExecutor ?? core.CmafPlanExecutor;
    if (!Executor) throw new Error('No browser-compatible CMAF executor available');
    const output: Blob = await new Executor().execute(plan);
    return await uploadBlob(output);
  } catch (err) {
    if (err instanceof Error && err.message.includes('Shelby SDK')) throw err;
    throw new Error(
      'Shelby media-prepare not installed. Add @shelby-protocol/media-prepare once you have early access.',
    );
  }
}

export function isShelbyConfigured(): boolean {
  // We can't synchronously check the import; this is a hint for UI to display
  // a setup-required notice. Refined at runtime by upload attempts.
  return Boolean(process.env.NEXT_PUBLIC_SHELBY_RPC);
}
