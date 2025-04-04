import { logger, l } from "./lib/logger";
import _ from "lodash";
import { readFileSync } from "fs";
import { LSPBuilder, LSP_TRANSPORTS } from "./lib/protocol/LSPBuilder";
const THRESHOLD_SCORE = 0.7;
logger.log("Staring the application");

const lsp = new LSPBuilder(LSP_TRANSPORTS.STDIO);

lsp.beforeAnyEvent((event, req) => {
  l`Got the event: ${event} with details`;
  req.startTime = performance.now();
});

lsp.afterAnyEvent((event, req, resp) => {
  const timeTaken = performance.now() - req.startTime;
  l`Event ${event} took ${+timeTaken.toPrecision(3)}ms to complete and Responded with: ${resp}`;
});

lsp.on("initialize", () => {
  return {
    capabilities: {
      textDocumentSync: 1,
    },
  };
});

lsp.on("initialized", () => {
  l`Got the initialized event`;
});

lsp.on("textDocument/didOpen", (params) => {
  diagnostic_internal(params.textDocument.uri, params.textDocument.text);
});

lsp.on("textDocument/didChange", (params) => {
  l`Got the didChange Event With the params: ${params}`;
  diagnostic(
    params.textDocument.uri,
    params.contentChanges.map((x) => x.text).join(""),
  );
});

lsp.on("textDocument/didSave", (params) => {
  const realPath = params.textDocument.uri.split("//")[1];
  if (realPath.length === 0) return;
  const text = readFileSync(realPath, "utf-8");
  diagnostic_internal(params.textDocument.uri, text);
});

export type PHIEntity = {
  Score: number;
  Text: string;
  BeginOffset: number;
  EndOffset: number;
  Type: string;
};

export async function pukar() {
  console.log("Jason");
}

async function findPhiEntity(text: string): Promise<PHIEntity[]> {
  const response = await fetch(
    "https://x421kf5kkb.execute-api.ap-southeast-2.amazonaws.com/default/PHICore",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    },
  );

  if (!response.ok) {
    l`Error in fetching PHI entities: ${response.status} ${response.statusText}`;
    return [];
  }

  const data = (await response.json()) as {
    Entities?: PHIEntity[];
    matches?: PHIEntity[];
  };
  l`Response from PHI API: ${response.status} ${response.statusText} ${data}`;
  return data?.Entities ?? data.matches ?? [];
}

lsp.on("exit", () => {
  l`Got the exit event`;
  process.exit(0);
});

const diagnostic = _.throttle(diagnostic_internal, 300, {
  leading: false,
  trailing: true,
});

async function diagnostic_internal(uri: string, text: string): Promise<void> {
  if (!text) return;
  l`Got the diagnostic event for ${uri} with text of length ${text.length}`;
  function convertOffsetToLineAndCharacter(offset: number): {
    line: number;
    character: number;
  } {
    const lines = text.slice(0, offset).split("\n");
    return {
      line: lines.length - 1,
      character: lines[lines.length - 1].length,
    };
  }

  function makeRange(entity: PHIEntity) {
    const start = convertOffsetToLineAndCharacter(entity.BeginOffset);
    const end = convertOffsetToLineAndCharacter(entity.EndOffset);
    return {
      start,
      end,
    };
  }
  if (!text) return;
  if (uri.split("//")[1].length === 0) return;
  l`Fetching Entities for the text`;
  const phiEntities = await findPhiEntity(text);
  l`Waiting for PHI entities to be found: ${phiEntities}`;
  const notification = {
    uri,
    diagnostics:
      phiEntities
        ?.filter((entity) => entity.Score > THRESHOLD_SCORE)
        .map((entity) => {
          return {
            range: makeRange(entity),
            severity: 1,
            source: "PHILsp",
            message: `${entity.Text} is a potential PHI of type ${entity.Type}(${(+entity.Score).toFixed(2).toString()}).Please Remove it.`,
          };
        }) ?? [],
  };

  lsp.notify("textDocument/publishDiagnostics", notification);
}
