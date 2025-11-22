import os from "os";
import chalk from "chalk";
import stringWidth from "string-width";

interface ModuleInfo {
  name: string;
  status?: "ok" | "warn" | "error";
  initTimeMs?: number;
}

interface StartupCliOptions {
  appName: string;
  version?: string;
  env: string;
  port: number | string;
  host?: string;
  bootTimeMs: number;
  modules?: ModuleInfo[];
  dbType?: string;
  dbAddress?: string;
}

function pad(text: string, width: number): string {
  const visible = stringWidth(text);
  if (visible >= width) return text;
  return text + " ".repeat(width - visible);
}

export function printStartupCli(opts: StartupCliOptions) {
  const {
    appName,
    version,
    env,
    port,
    host = "localhost",
    bootTimeMs,
    modules = [],
  } = opts;

  const url = `http://${host}:${port}`;
  const nodeVersion = process.version;
  const cpuCount = os.cpus().length;
  const totalMemGb = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);

  // 1) ASCII banner façon Spring Boot
  const titleLine = version
    ? `${appName} ${chalk.dim(`v${version}`)}`
    : appName;

  const asciiBanner = ["", chalk.green("   :: " + titleLine + " ::"), ""];

  // 2) Tableau d’infos façon Nest CLI
  const tableRows: [string, string][] = [
    ["Env", chalk.cyan(env)],
    ["Port", chalk.cyan(String(port))],
    ["URL", chalk.cyan(url)],
    ["Logger", chalk.yellow("Pino")],
    ["Started in", chalk.magenta(`${bootTimeMs} ms`)],
    ["Node", chalk.blue(nodeVersion)],
    ["CPU", chalk.blue(`${cpuCount} cores`)],
    ["Memory", chalk.blue(`${totalMemGb} GB`)],
  ];

  if (opts.dbType) {
    tableRows.push(["DB Type", chalk.yellow(opts.dbType)]);
  }
  if (opts.dbAddress) {
    tableRows.push(["DB Address", chalk.yellow(opts.dbAddress)]);
  }

  const keyWidth = Math.max(...tableRows.map(([k]) => stringWidth(k))) + 2;
  const valWidth = Math.max(...tableRows.map(([, v]) => stringWidth(v))) + 2;
  const totalWidth = keyWidth + valWidth + 5;

  const top = chalk.green("┌" + "─".repeat(totalWidth - 2) + "┐");
  const bottom = chalk.green("└" + "─".repeat(totalWidth - 2) + "┘");
  const separator = chalk.green("├" + "─".repeat(totalWidth - 2) + "┤");

  const formatRow = (key: string, value: string) =>
    chalk.green("│") +
    ` ${pad(key + ":", keyWidth)} ${pad(value, valWidth)} ` +
    chalk.green("│");

  const tableLines = [
    top,
    ...tableRows.map(([k, v]) => formatRow(k, v)),
    bottom,
  ];

  // 3) Modules façon NestJS
  const moduleLines: string[] = [];
  if (modules.length > 0) {
    moduleLines.push("");
    moduleLines.push(chalk.cyan("Modules:"));
    modules.forEach((m) => {
      const statusIcon =
        m.status === "ok"
          ? chalk.green("✔")
          : m.status === "warn"
          ? chalk.yellow("⚠")
          : m.status === "error"
          ? chalk.red("✖")
          : chalk.white("•");

      const time =
        m.initTimeMs != null ? chalk.gray(`+${m.initTimeMs.toFixed(0)}ms`) : "";

      moduleLines.push(
        `${chalk.gray("[App]")} ${statusIcon} ${chalk.white(
          pad(m.name, 24)
        )} ${time}`
      );
    });
  }

  // 4) Diagnostic ligne type Nest
  const diagLine =
    chalk.gray("[Diag]") +
    " " +
    chalk.white(
      `Node ${nodeVersion} | CPU ${cpuCount} cores | RAM ${totalMemGb} GB`
    );

  // 5) Affichage final
  [
    ...asciiBanner,
    ...tableLines,
    "",
    ...moduleLines,
    moduleLines.length ? "" : "",
    diagLine,
    "",
  ].forEach((line) => console.log(line));
}
