import fg from "fast-glob";
import { pathToFileURL } from "url";
import { resolve } from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { container as rootContainer, type DependencyContainer } from "tsyringe";
import { performance } from "node:perf_hooks";
import {
  snapshotContainer,
  type ContainerSnapshot,
  type ProviderKind,
} from "./containerIntrospection.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const rootFromDir = __dirname.includes("dist") ? "dist" : "src";

type ScanOptions = {
  roots?: string[];
  patterns?: string[];
  strict?: boolean;
  container?: DependencyContainer; // container à observer (parent)
};

function detectRole(
  file: string
): "registry" | "controller" | "service" | "repository" | "usecase" | "other" {
  const lower = file.toLowerCase();

  if (lower.includes(".registry.") || lower.includes(".registrar.")) {
    return "registry";
  }
  if (lower.includes(".controller.")) {
    return "controller";
  }
  if (lower.includes(".service.")) {
    return "service";
  }
  if (lower.includes(".repository.")) {
    return "repository";
  }
  if (lower.includes(".usecase.") || lower.includes(".usecases.")) {
    return "usecase";
  }
  return "other";
}

function formatToken(token: unknown): string {
  if (typeof token === "string") return `token "${token}"`;
  if (typeof token === "symbol") return token.toString();
  if (typeof token === "function" && (token as any).name) {
    return `class ${(token as any).name}`;
  }
  return String(token);
}

function formatProviderKind(kind: ProviderKind): string {
  switch (kind) {
    case "class":
      return "useClass";
    case "value":
      return "useValue";
    case "factory":
      return "useFactory";
    case "token":
      return "useToken";
    default:
      return "unknown";
  }
}

function diffSnapshots(
  before: ContainerSnapshot,
  after: ContainerSnapshot,
  container?: DependencyContainer
) {
  const added: {
    token: unknown;
    infos: { providerKind: ProviderKind; element?: any }[];
  }[] = [];

  for (const [token, infosAfter] of after.byToken.entries()) {
    const infosBefore = before.byToken.get(token) ?? [];
    if (infosAfter.length > infosBefore.length) {
      added.push({
        token,
        infos: infosAfter.slice(infosBefore.length).map((i) => ({
          providerKind: i.providerKind,
          element: getClassName(i.provider, container),
        })),
      });
    }
  }

  return added;
}

function getClassName(
  element: any,
  container?: DependencyContainer
): string | undefined {
  if (element.useClass) {
    // Cas le plus fréquent : useClass: MaClasse
    return element.useClass.name || "(anonymous class)";
  }

  if (Object.prototype.hasOwnProperty.call(element, "useValue")) {
    const v = element.useValue;
    if (v === null) return "null";
    if (typeof v === "object" && v?.constructor?.name) {
      return v.constructor.name;
    }
    return typeof v;
  }

  // in dev we can try to introspect factory return type
  if (element.useFactory) {
    if (process.env.NODE_ENV === "production") {
      return `factory(${element.useFactory.name || "anonymous"})`;
    }
    return introspectFactoryReturnTypeName(element.useFactory, container);
  }

  if (element.useToken) {
    const t = element.useToken;
    if (typeof t === "string") return `token("${t}")`;
    if (typeof t === "function" && t.name) return `token(class ${t.name})`;
    if (typeof t === "symbol") return `token(${t.toString()})`;
    return "token";
  }

  return undefined;
}

function introspectFactoryReturnTypeName(
  factory: any,
  container?: DependencyContainer
): string | undefined {
  // ⚠️ Should only be used in dev mode

  try {
    // Si la factory attend le container, on le passe
    const result =
      factory.length > 0 && container ? factory(container) : factory();

    if (result && result.constructor && result.constructor.name) {
      return result.constructor.name;
    }

    return `factory(${factory.name || "anonymous"})`;
  } catch {
    // On ne casse jamais l’autoRegister si la factory throw
    return `factory(${factory.name || "anonymous"})`;
  }
}

/**
 * Scan files, import them (side effects) et affiche :
 *  - les fichiers trouvés
 *  - les registrations ajoutées dans le container
 */
export async function autoRegister({
  roots = [rootFromDir],
  patterns = [
    "**/*.registrar.[tj]s",
    "**/*.registry.[tj]s",
    "**/*.@(controller|repository|usecases|service).[tj]s",
  ],
  strict = false,
  container = rootContainer,
}: ScanOptions = {}) {
  const globs = roots.flatMap((r) => patterns.map((p) => `${r}/${p}`));

  const start = performance.now();

  // snapshot avant
  const before = snapshotContainer(container);

  const files = await fg(globs, {
    dot: false,
    ignore: ["**/*.d.ts"],
  });

  if (!files.length && strict) {
    throw new Error(
      `autoRegister: aucun fichier trouvé pour ${globs.join(", ")}`
    );
  }

  const projectRoot = process.cwd();

  await Promise.all(
    files.map(async (f) => {
      const full = resolve(projectRoot, f);
      await import(pathToFileURL(full).href);
    })
  );

  // snapshot après
  const after = snapshotContainer(container);

  const durationMs = performance.now() - start;

  // DIFF registrations
  const added = diffSnapshots(before, after, container);

  // --- Affichage CLI ---

  console.log("");
  console.log(chalk.cyan("  DI auto-registration"));
  console.log(chalk.cyan("  ─────────────────────"));
  console.log(
    `  Racine : ${chalk.green(roots.join(", "))}   (${
      files.length
    } fichiers scannés, ${durationMs.toFixed(1)} ms)`
  );

  if (!files.length) {
    console.log(chalk.yellow("  Aucun fichier chargé."));
  } else {
    console.log("\n  Fichiers :");
    files.forEach((file) => {
      const role = detectRole(file);
      const icon =
        role === "controller"
          ? chalk.blue("◎")
          : role === "service"
          ? chalk.green("◆")
          : role === "repository"
          ? chalk.magenta("◈")
          : role === "registry"
          ? chalk.cyan("⬢")
          : role === "usecase"
          ? chalk.yellow("⬡")
          : chalk.white("•");

      console.log(`    ${icon} ${chalk.gray(file)} (${role})`);
    });
  }

  console.log("\n  Registrations ajoutées dans le container :");

  if (!added.length) {
    console.log(chalk.yellow("    Aucune nouvelle registration détectée."));
  } else {
    added.forEach(({ token, infos }) => {
      const tokenLabel = formatToken(token);
      const kinds = infos.map((i) => formatProviderKind(i.providerKind));
      console.log(
        `    ${chalk.green("✔")} ${chalk.white(tokenLabel)}  →  ${chalk.cyan(
          kinds.join(", ")
        )} { ${infos.map((i) => i.element).join(", ")} }`
      );
    });
  }

  console.log("");

  return {
    root: roots[0]!,
    files,
    durationMs,
    added,
  };
}
