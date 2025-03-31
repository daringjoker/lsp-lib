import { join } from "path";
import { inspect } from "util";
import { createWriteStream } from "fs";

const logfile = createWriteStream(
  join("/home/pukargiri/personals/pubconLsp/log.txt"),
  { flags: "a" },
);
export const logger = {
  log(msg: string) {
    const time = new Date().toTimeString().split(" ")[0];
    logfile.write(`[${time}] DJLSP: ${msg}\n`);
  },
};

export function l(stringToks: TemplateStringsArray, ...insertions: unknown[]) {
  let msg = stringToks.reduce((acc, curr, index) => {
    return `${acc}${inspect(insertions[index - 1], false, null, true)}${curr}`;
  });
  logger.log(msg);
}
