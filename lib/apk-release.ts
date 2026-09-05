export type ApkReleaseInfo =
  | { status: "available"; sizeBytes: number }
  | { status: "unpublished" | "unavailable" };

// Deriva a consulta do próprio link de download: não há um segundo repositório
// para atualizar nem necessidade de baixar o APK para descobrir o tamanho.
export function releaseLookup(downloadUrl: string) {
  const url = new URL(downloadUrl);
  const parts = url.pathname.split("/");
  if (url.origin !== "https://github.com" || url.username || url.password ||
      parts.length !== 7 || parts.slice(3, 6).join("/") !== "releases/latest/download" ||
      !parts[1] || !parts[2] || !parts[6]) {
    throw new Error("Link de Release inválido");
  }
  return {
    apiUrl: `https://api.github.com/repos/${parts[1]}/${parts[2]}/releases/latest`,
    assetName: decodeURIComponent(parts[6]),
  };
}

export function formatApkSize(bytes: number): string {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(bytes / 1_000_000)} MB`;
}

export async function loadApkRelease(
  downloadUrl: string,
  fetcher: typeof fetch = fetch,
): Promise<ApkReleaseInfo> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const { apiUrl, assetName } = releaseLookup(downloadUrl);
    const response = await fetcher(apiUrl, {
      headers: { Accept: "application/vnd.github+json" },
      cache: "no-store",
      credentials: "omit",
      signal: controller.signal,
    });
    if (response.status === 404) return { status: "unpublished" };
    if (!response.ok) return { status: "unavailable" };
    const raw: unknown = await response.json();
    if (!raw || typeof raw !== "object") return { status: "unavailable" };
    const release = raw as Record<string, unknown>;
    if (!Array.isArray(release.assets)) return { status: "unavailable" };
    if (release.draft || release.prerelease) return { status: "unpublished" };
    const asset = release.assets.find((item: { name?: string } | null) => item?.name === assetName);
    if (!asset || asset.state !== "uploaded") return { status: "unpublished" };
    if (!Number.isSafeInteger(asset.size) || asset.size <= 0) return { status: "unavailable" };
    return { status: "available", sizeBytes: asset.size };
  } catch {
    // Uma indisponibilidade da API não deve impedir um download válido.
    return { status: "unavailable" };
  } finally {
    clearTimeout(timeout);
  }
}
