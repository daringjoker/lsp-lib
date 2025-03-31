"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Decoder = void 0;
var events_1 = require("events");
var Decoder = /** @class */ (function (_super) {
    __extends(Decoder, _super);
    function Decoder(inputStream) {
        var _this = _super.call(this) || this;
        _this.headerSize = 0;
        _this.contentSize = 0;
        _this.readSize = 0;
        _this.input = inputStream;
        _this.input.on("data", _this.addBuffer.bind(_this));
        _this.input.on("end", _this.end.bind(_this));
        _this.buffer = Buffer.alloc(0);
        return _this;
    }
    Decoder.prototype.parseHeader = function (header) {
        var lines = header.toString().split("\r\n");
        var headers = lines.reduce(function (obj, line) {
            if (line.trim() === "")
                return obj;
            var _a = __read(line.split(":"), 2), key = _a[0], value = _a[1];
            obj[key.toLowerCase().trim()] = value.trim();
            return obj;
        }, {});
        this.contentSize = parseInt(headers["content-length"]);
    };
    Decoder.prototype.addBuffer = function (data) {
        if (this.buffer) {
            this.buffer = Buffer.concat([this.buffer, data]);
        }
        else {
            this.buffer = data;
        }
        this.tryDecode();
    };
    Decoder.prototype.tryDecode = function () {
        if (!this.headerSize) {
            this.tryDecodeHeader();
        }
        if (!this.headerSize)
            return;
        if (this.readSize) {
            this.decode();
        }
    };
    Decoder.prototype.tryDecodeHeader = function () {
        var matchIndex = this.buffer.indexOf("\r\n\r\n");
        if (matchIndex !== -1) {
            this.headerSize = matchIndex + 4;
            this.parseHeader(this.buffer.subarray(0, this.headerSize));
            this.readSize = this.headerSize + this.contentSize;
        }
    };
    Decoder.prototype.decode = function () {
        if (this.readSize && this.buffer.length >= this.readSize) {
            this.emit("message", JSON.parse(this.buffer.subarray(this.headerSize, this.readSize).toString()));
            this.buffer = this.buffer.subarray(this.readSize);
            this.readSize = 0;
            this.headerSize = 0;
            this.tryDecode();
        }
    };
    Decoder.prototype.end = function () {
        this.emit("end");
    };
    return Decoder;
}(events_1.EventEmitter));
exports.Decoder = Decoder;
