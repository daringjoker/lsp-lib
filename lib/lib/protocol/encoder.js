"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Encoder = void 0;
var Encoder = /** @class */ (function () {
    function Encoder(out) {
        this.out = out;
    }
    Encoder.prototype.send = function (data) {
        var json = JSON.stringify(data);
        var header = "Content-Length: ".concat(json.length, "\r\n\r\n");
        this.out.write(header + json);
        return json.length;
    };
    return Encoder;
}());
exports.Encoder = Encoder;
