/**
 * Image generation through Manus Forge locally, with Cloudflare Workers AI as
 * the production path. Generated images are persisted through the active media
 * runtime so Dream Door records remain usable after the request ends.
 */
import { storagePut } from "server/storage";
import { getRuntime } from "server/runtime";
import { ENV } from "./env";

const DEFAULT_IMAGE_MODEL = "MODEL_GPT_IMAGE_2";
const DEFAULT_IMAGE_QUALITY = "medium";
const CLOUDFLARE_IMAGE_MODEL = "@cf/black-forest-labs/flux-1-schnell";

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{ url?: string; b64Json?: string; mimeType?: string }>;
  model?: string;
  quality?: string;
};

export type GenerateImageResponse = { url?: string };

type CloudflareImageResult = { image?: string };

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function generateWithCloudflareAI(prompt: string): Promise<GenerateImageResponse> {
  const ai = getRuntime()?.ai;
  if (!ai) throw new Error("Cloudflare Workers AI is not configured. Add an AI binding named AI and redeploy.");

  const result = (await ai.run(CLOUDFLARE_IMAGE_MODEL, {
    prompt: prompt.slice(0, 2048),
    steps: 4,
    seed: Math.floor(Math.random() * 2_147_483_647),
  })) as CloudflareImageResult;

  if (!result.image) throw new Error("The House returned no image from the Cloudflare image chamber.");
  const asset = await storagePut(`generated/dream-${Date.now()}.jpg`, base64ToBytes(result.image), "image/jpeg");
  return { url: asset.url };
}

async function generateWithForge(options: GenerateImageOptions): Promise<GenerateImageResponse> {
  if (!ENV.forgeApiUrl) throw new Error("BUILT_IN_FORGE_API_URL is not configured");
  if (!ENV.forgeApiKey) throw new Error("BUILT_IN_FORGE_API_KEY is not configured");

  const baseUrl = ENV.forgeApiUrl.endsWith("/") ? ENV.forgeApiUrl : `${ENV.forgeApiUrl}/`;
  const fullUrl = new URL("images.v1.ImageService/GenerateImage", baseUrl).toString();
  const model = options.model ?? DEFAULT_IMAGE_MODEL;
  const quality = options.quality ?? (model === DEFAULT_IMAGE_MODEL ? DEFAULT_IMAGE_QUALITY : undefined);
  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "connect-protocol-version": "1",
      authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify({ prompt: options.prompt, original_images: options.originalImages || [], model, ...(quality ? { quality } : {}) }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Image generation request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`);
  }
  const result = (await response.json()) as { image: { b64Json: string; mimeType: string } };
  const asset = await storagePut(`generated/${Date.now()}.png`, Buffer.from(result.image.b64Json, "base64"), result.image.mimeType);
  return { url: asset.url };
}

export async function generateImage(options: GenerateImageOptions): Promise<GenerateImageResponse> {
  // GPT Image 2 through Manus Forge is preferred whenever its free built-in
  // service is available. Cloudflare Workers AI is the production fallback
  // when the Worker does not have Manus Forge environment variables.
  if (ENV.forgeApiUrl && ENV.forgeApiKey) return generateWithForge(options);
  if (getRuntime()?.ai) return generateWithCloudflareAI(options.prompt);
  return generateWithForge(options);
}

export type ImageModelInfo = { model?: string; id?: string };
export type ListImageModelsResponse = { models: ImageModelInfo[] };

export async function listImageModels(): Promise<ListImageModelsResponse> {
  if (!ENV.forgeApiUrl) throw new Error("BUILT_IN_FORGE_API_URL is not configured");
  if (!ENV.forgeApiKey) throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
  const baseUrl = ENV.forgeApiUrl.endsWith("/") ? ENV.forgeApiUrl : `${ENV.forgeApiUrl}/`;
  const response = await fetch(new URL("images.v1.ImageService/ListModels", baseUrl), {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json", "connect-protocol-version": "1", authorization: `Bearer ${ENV.forgeApiKey}` },
    body: "{}",
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`List image models failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`);
  }
  const result = (await response.json()) as { models?: ImageModelInfo[] };
  return { models: result.models ?? [] };
}
