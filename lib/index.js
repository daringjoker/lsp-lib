"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var logger_1 = require("./lib/logger");
var decoder_1 = require("./lib/protocol/decoder");
var encoder_1 = require("./lib/protocol/encoder");
var util_1 = require("util");
logger_1.logger.log("Staring the application");
var stdIn = process.stdin;
var stdOut = process.stdout;
var decoder = new decoder_1.Decoder(stdIn);
var encoder = new encoder_1.Encoder(stdOut);
decoder.on("message", function (message) {
    var method = message.method;
    logger_1.logger.log("Invoked the Method: ".concat(method));
    if (!method) {
        logger_1.logger.log("Invalid Method");
        logger_1.logger.log((0, util_1.inspect)(message, false, null, true));
        return;
    }
    if (method === "initialize") {
        encoder.send({
            jsonrpc: "2.0",
            id: message.id,
            result: {
                capabilities: {
                    textDocumentSync: 1,
                }
            }
        });
    }
});
decoder.on("end", function () {
    logger_1.logger.log("Stream Ended");
    process.exit(0);
});
