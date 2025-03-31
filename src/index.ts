import { logger, l } from "./lib/logger";
import { LSPBuilder, LSP_TRANSPORTS } from "./lib/protocol/LSPBuilder";

logger.log("Staring the application");

const lsp = new LSPBuilder(LSP_TRANSPORTS.STDIO);

lsp.beforeAnyEvent((event, req) => {
  l`Got the event: ${event} with detail ${req}`;
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
  l`Got the textDocument/didOpen event with params: ${params}`;
  diagnostic(params.textDocument.uri, params.textDocument.text);
});

lsp.on("textDocument/didChange", (params) => {
  l`Got the textDocument/didChange event with params: ${params}`;
  diagnostic(params.textDocument.uri, params.textDocument.text);
});

async function diagnostic(uri: string, text: string): Promise<void> {
  l`Checking the first word of the document: ${text}`;
  if (!text) return;
  if (uri.split("//")[1].length === 0) return;
  function makeRange(index: number, len: number) {
    const lines = text.slice(0, index).split("\n");
    return {
      start: {
        line: lines.length - 1,
        character: lines[lines.length - 1].length,
      },
      end: {
        line: lines.length - 1,
        character: lines[lines.length - 1].length + len,
      },
    };
  }
  const indexes = [];
  let startIndex = 0;
  do {
    const pukarIndexed = text.indexOf("pukar", startIndex);
    if (pukarIndexed !== -1) {
      indexes.push(pukarIndexed);
      startIndex = pukarIndexed + 5;
    } else {
      startIndex = text.length;
    }
  } while (startIndex < text.length);
  if (indexes.length === 0) return;
  const notification = {
    uri,
    diagnostics: indexes.map((firstSpace) => {
      return {
        range: makeRange(firstSpace, 5),
        severity: 1,
        source: "DaringLSP",
        message: `'pukar' is potential PHI. Consider removing it.`,
      };
    }),
  };

  lsp.notify("textDocument/publishDiagnostics", notification);
}
