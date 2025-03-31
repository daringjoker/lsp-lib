import { EventEmitter } from "events";
import { LSPERROR } from "../../types/common";
import {
  NotificationMessage,
  RequestMessage,
  ResponseMessage,
} from "../../types/message";
import { l } from "../logger";
import { Decoder } from "../transport/decoder";
import { Encoder } from "../transport/encoder";

export const LSP_TRANSPORTS = {
  STDIO: "stdio",
  SOCKET: "socket",
  IPC: "ipc",
} as const;

export type LSPTransport = (typeof LSP_TRANSPORTS)[keyof typeof LSP_TRANSPORTS];

export class LSPBuilder {
  private readonly eventsTargets: Record<
    symbol | string,
    (...args: any) => any
  > = {};
  private beforeEvent?: (...args: any) => any;
  private afterEvent?: (...args: any) => any;
  private eventSource: EventEmitter;
  private sink: Encoder;

  constructor(transport: LSPTransport) {
    if (transport === LSP_TRANSPORTS.STDIO) {
      this.eventSource = new Decoder(process.stdin);
      this.sink = new Encoder(process.stdout);
    } else {
      throw new Error(`Transport not Implemented: ${transport}`);
    }
    this.eventSource.on("message", this.respond.bind(this));
    this.eventSource.on("end", () => {
      this.emit("exit", {} as RequestMessage);
      process.exit(0);
    });
  }

  beforeAnyEvent(listener: (...args: any) => any) {
    this.beforeEvent = listener;
  }

  afterAnyEvent(listener: (...args: any) => any) {
    this.afterEvent = listener;
  }

  on(event: string, listener: (...args: any) => any) {
    if (this.eventsTargets[event]) {
      throw new Error(`Event ${event} already registered`);
    }
    this.eventsTargets[event] = listener;
  }

  private emit(event: string, req: RequestMessage) {
    try {
      if (this.beforeEvent) {
        this.beforeEvent(event, req);
      }
      if (this.eventsTargets[event]) {
        const retVal = this.eventsTargets[event](req.params);
        if (this.afterEvent) {
          this.afterEvent(event, req, retVal);
        }
        this.handleResponse(req, retVal);
      }
    } catch (e) {
      l`Error in event handler: ${e}`;
      this.sink.writeError(req, e as LSPERROR);
    }
  }

  public notify<T>(event: string, params: NotificationMessage<T>["params"]) {
    this.sink.writeNotification(event, params);
  }

  private handleResponse(req: RequestMessage, retVal: unknown) {
    if (retVal instanceof Promise) {
      retVal
        .then(this.sink.writeResponse.bind(this.sink, req))
        .catch(this.sink.writeError.bind(this.sink, req));
      return;
    } else {
      this.sink.writeResponse(req, retVal as ResponseMessage["result"]);
    }
  }

  respond(msg: RequestMessage) {
    this.emit(msg.method, msg);
  }
}
