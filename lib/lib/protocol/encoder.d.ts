/// <reference types="node" />
import { Writable } from 'stream';
export declare class Encoder {
    private out;
    constructor(out: Writable);
    send(data: any): number;
}
