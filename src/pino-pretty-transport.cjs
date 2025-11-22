module.exports = (opts) =>
  require("pino-pretty")({
    ...opts,
    messageFormat: (log, messageKey) => {
      const context = log.context ? `${log.context}` : null;
      const msg = log[messageKey] || "";

      const meta = Object.entries(log)
        .filter(
          ([k]) =>
            ![
              "level",
              messageKey,
              "time",
              "pid",
              "hostname",
              "context",
            ].includes(k)
        )
        .map(([k, v]) => `${k}=${v}`)
        .join(", ");

      const metaPart = meta ? ` (${meta})` : "";

      if (context) {
        return `[${context}] -- ${msg} ${metaPart}`;
      }

      return `${msg}`;
    },
  });
