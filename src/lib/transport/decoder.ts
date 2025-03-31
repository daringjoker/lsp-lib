import { Readable } from "node:stream";
import { EventEmitter } from "events";

export class Decoder extends EventEmitter {
  private input: Readable;
  private buffer: Buffer;
  private headerSize: number = 0;
  private contentSize: number = 0;
  private readSize: number = 0;

  constructor(inputStream: Readable) {
    super();
    this.input = inputStream;
    this.input.on("data", this.addBuffer.bind(this));
    this.input.on("end", this.end.bind(this));
    this.buffer = Buffer.alloc(0);
  }

  private parseHeader(header: Buffer) {
    const lines = header.toString().split("\r\n");
    const headers = lines.reduce((obj, line) => {
      if (line.trim() === "") return obj;
      const [key, value] = line.split(":");
      obj[key.toLowerCase().trim()] = value.trim();
      return obj;
    }, {} as Record<string, string>);
    this.contentSize = parseInt(headers["content-length"]);
  }

  private addBuffer(data: Buffer) {
    if (this.buffer) {
      this.buffer = Buffer.concat([this.buffer, data]);
    } else {
      this.buffer = data;
    }
    this.tryDecode();
  }

  private tryDecode() {
    if (!this.headerSize) {
      this.tryDecodeHeader();
    }

    if (!this.headerSize)
      return;
    if (this.readSize) {
      this.decode();
    }
  }

  private tryDecodeHeader() {
    const matchIndex = this.buffer.indexOf("\r\n\r\n");
    if (matchIndex !== -1) {
      this.headerSize = matchIndex + 4;
      this.parseHeader(this.buffer.subarray(0, this.headerSize));
      this.readSize = this.headerSize + this.contentSize;
    }
  }

  private decode() {
    if (this.readSize && this.buffer.length >= this.readSize) {
      this.emit("message", JSON.parse(this.buffer.subarray(this.headerSize, this.readSize).toString()));
      this.buffer = this.buffer.subarray(this.readSize);
      this.readSize = 0;
      this.headerSize = 0;
      this.tryDecode();
    }
  }

  private end() {
    this.emit("end");
  }
}
