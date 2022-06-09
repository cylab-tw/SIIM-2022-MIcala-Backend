const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const decimal = require('../FHIRDataTypesSchema/decimal');
const string = require('../FHIRDataTypesSchema/string');
const uri = require('../FHIRDataTypesSchema/uri');
const code = require('../FHIRDataTypesSchema/code');

const {
    Count
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Count.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    value: decimal,
    comparator: {
        type: String,
        enum: ["<", "<=", ">=", ">"],
        default: void 0
    },
    unit: string,
    system: uri,
    code: code
});
module.exports.Count = Count;