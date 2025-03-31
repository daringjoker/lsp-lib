"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
var fs_1 = require("fs");
var path_1 = require("path");
var logfile = (0, fs_1.createWriteStream)((0, path_1.join)("/home/pukargiri/personals/pubconLsp/log.txt"), { flags: "a" });
exports.logger = {
    log: function (msg) {
        var time = new Date().toTimeString().split(" ")[0];
        logfile.write("[".concat(time, "] DJLSP: ").concat(msg, "\n"));
    }
};
