import { logger, l } from "./lib/logger";
import { LSPBuilder, LSP_TRANSPORTS } from "./lib/protocol/LSPBuilder";

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
  diagnostic(params.textDocument.uri, params.textDocument.text);
});

lsp.on("textDocument/didSave", (params) => {
  diagnostic(params.textDocument.uri, params.textDocument.text);
});

export type PHIEntity = {
  Score: number;
  Text: string;
  BeginOffset: number;
  EndOffset: number;
  Type: string;
};

export async function pukar() {
  console.log("Pukar");
}

async function findPhiEntity(text: string): Promise<PHIEntity[]> {
  const response = await fetch(
    "https://05jqa3k3vb.execute-api.ap-southeast-2.amazonaws.com/default/phiPioliceMock",
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
    Entites?: PHIEntity[];
    matches?: PHIEntity[];
  };
  l`Response from PHI API: ${response.status} ${response.statusText} ${data}`;
  return data?.Entites ?? data.matches ?? [];
}

lsp.on("exit", () => {
  l`Got the exit event`;
  process.exit(0);
});

async function diagnostic(uri: string, text: string): Promise<void> {
  l`Got the diagnostic event for ${uri} with text of length ${text.length}`;
  function converOffsetToLineAndCharacter(offset: number): {
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
    const start = converOffsetToLineAndCharacter(entity.BeginOffset);
    const end = converOffsetToLineAndCharacter(entity.EndOffset);
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
      phiEntities?.map((entity) => {
        return {
          range: makeRange(entity),
          severity: 1,
          source: "DaringLSP",
          message: `${entity.Text} is a potential PHI of type ${entity.Type}.Please Remove it.`,
        };
      }) ?? [],
  };

  lsp.notify("textDocument/publishDiagnostics", notification);
}
