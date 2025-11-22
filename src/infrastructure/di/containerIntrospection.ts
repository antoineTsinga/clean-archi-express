import type { DependencyContainer } from "tsyringe";

export type ProviderKind = "class" | "value" | "factory" | "token" | "unknown";

export interface RegistrationInfo {
  token: unknown;
  providerKind: ProviderKind;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provider: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any; // l’objet Registration brut (pour debug)
}

export interface ContainerSnapshot {
  // Map token -> registrations
  byToken: Map<unknown, RegistrationInfo[]>;
}

/**
 * Take a snapshot of the current registrations in the given container.
 * Uses internal tsyringe APIs, intended for debugging purposes.
 * @param container
 * @returns ContainerSnapshot
 */
export function snapshotContainer(
  container: DependencyContainer
): ContainerSnapshot {
  const internal = container as any;

  const registry = internal._registry;
  if (!registry || typeof registry.entries !== "function") {
    return { byToken: new Map() };
  }

  const byToken = new Map<unknown, RegistrationInfo[]>();

  for (const [token, registrations] of registry.entries() as Iterable<
    [unknown, any[]]
  >) {
    const infos: RegistrationInfo[] = registrations.map((reg: any) => {
      const provider = reg.provider ?? reg; // suivant version
      let providerKind: ProviderKind = "unknown";

      if (provider.useClass) providerKind = "class";
      else if (provider.useValue !== undefined) providerKind = "value";
      else if (provider.useFactory) providerKind = "factory";
      else if (provider.useToken) providerKind = "token";

      return {
        token,
        providerKind,
        provider,
        raw: reg,
      };
    });

    byToken.set(token, infos);
  }

  return { byToken };
}
