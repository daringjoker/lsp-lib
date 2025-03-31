/// <reference types="node" />
/// <reference types="node" />
import { Readable } from "node:stream";
import { EventEmitter } from "events";
export declare class Decoder extends EventEmitter {
    private input;
    private buffer;
    private headerSize;
    private contentSize;
    private readSize;
    constructor(inputStream: Readable);
    private parseHeader;
    private addBuffer;
    private tryDecode;
    private tryDecodeHeader;
    private decode;
    private end;
}
