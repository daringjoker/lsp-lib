import { join } from "path";
import { inspect } from "util";
import { createWriteStream } from "fs";
import { existsSync } from "fs";

const logFilePath = join(__dirname, "../../log.txt");

const shouldLog = existsSync(logFilePath);

const logfile = shouldLog
  ? createWriteStream(logFilePath, {
      flags: "a",
    })
  : null;

export const logger = {
  log(msg: string) {
    if (!shouldLog || !logfile) return;
    const time = new Date().toTimeString().split(" ")[0];
    logfile?.write(`[${time}] DJLSP: ${msg}\n`);
  },
};

export function l(stringToks: TemplateStringsArray, ...insertions: unknown[]) {
  let msg = stringToks.reduce((acc, curr, index) => {
    return `${acc}${inspect(insertions[index - 1], false, null, true)}${curr}`;
  });
  logger.log(msg);
}
