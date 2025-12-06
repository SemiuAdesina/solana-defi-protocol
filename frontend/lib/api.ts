// Use relative paths so Next.js rewrites can handle the routing
// This allows the same code to work in both Docker and local development
const getBackendUrl = (): string => {
  // In browser, use relative paths (Next.js rewrites will handle it)
  if (typeof window !== "undefined") {
    return "";
  }
  // On server-side, use the environment variable or default
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";
};

export type RegistryMetadata = {
  authority: string;
  version: number;
  metadataUri: string | null;
  metadataChecksum: number[] | null;
};

export type CiStatus = {
  pipeline: string;
  status: string;
  commit: string;
  runId: string;
  triggeredBy: string;
  timestamp: string;
};

export const fetchMetadata = async (authority: string): Promise<RegistryMetadata | null> => {
  const backendUrl = getBackendUrl();
  const res = await fetch(`${backendUrl}/metadata/${authority}`);
  if (!res.ok) {
    return null;
  }
  const data = (await res.json()) as RegistryMetadata;
  return data;
};

export const fetchCiStatuses = async (): Promise<CiStatus[]> => {
  const backendUrl = getBackendUrl();
  const res = await fetch(`${backendUrl}/ci/status`);
  if (!res.ok) {
    return [];
  }
  const data = (await res.json()) as CiStatus[];
  return data;
};

