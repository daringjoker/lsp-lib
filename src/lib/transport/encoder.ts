import { Writable } from "stream";
import {
  Message,
  NotificationMessage,
  RequestMessage,
  ResponseMessage,
} from "../../types/message";
import { LSPERROR } from "../../types/common";
import { l } from "../logger";

export class Encoder {
  private out: Writable;
  constructor(out: Writable) {
    this.out = out;
  }
  public write<T extends Message>(data: T): number {
    const json = JSON.stringify(data);
    const header = `Content-Length: ${json.length}\r\n\r\n`;
    this.out.write(header + json);
    l`Encoder: ${json.length} bytes written to stream`;
    l`Encoder: ${json}`;
    return json.length;
  }

  public writeError(req: RequestMessage, err: LSPERROR): void {
    this.write({
      jsonrpc: "2.0",
      error: {
        code: err.code,
        message: err.message,
        data: err.stack,
      },
      id: req.id,
    });
  }
  public writeNotification(
    method: string,
    params: NotificationMessage<unknown>["params"],
  ): void {
    this.write({
      jsonrpc: "2.0",
      method,
      params,
    });
  }
  public writeResponse(
    req: RequestMessage,
    data: ResponseMessage["result"],
  ): void {
    if (!req.id) {
      l`Encoder: Request id is {${req.id}}. Skipping response`;
      return;
    }
    this.write({
      jsonrpc: "2.0",
      result: data ?? null,
      id: req.id,
    });
  }
}
