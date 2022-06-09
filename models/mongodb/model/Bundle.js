const moment = require('moment');
const _ = require('lodash');
const mongoose = require('mongoose');
const {
    Meta
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const uri = require('../FHIRDataTypesSchema/uri');
const code = require('../FHIRDataTypesSchema/code');
const {
    Identifier
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const instant = require('../FHIRDataTypesSchema/instant');
const unsignedInt = require('../FHIRDataTypesSchema/unsignedInt');
const {
    Bundle_Link
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    Bundle_Entry
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    Signature
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const id = require('../FHIRDataTypesSchema/id');
module.exports = function() {
    require('mongoose-schema-jsonschema')(mongoose);
    const Bundle = {
        meta: {
            type: Meta,
            default: void 0
        },
        implicitRules: uri,
        language: code,
        identifier: {
            type: Identifier,
            default: void 0
        },
        type: {
            type: String,
            enum: ["document", "message", "transaction", "transaction-response", "batch", "batch-response", "history", "searchset", "collection"],
            default: void 0
        },
        timestamp: instant,
        total: unsignedInt,
        link: {
            type: [Bundle_Link],
            default: void 0
        },
        entry: {
            type: [Bundle_Entry],
            default: void 0
        },
        signature: {
            type: Signature,
            default: void 0
        },
        resourceType: {
            type: String,
            required: true,
            enum: [
                "Bundle"
            ]
        }
    };

    Bundle.id = {
        ...id,
        index: true
    };
    Bundle.contained = {
        type: [Object],
        default: void 0
    };
    module.exports.schema = Bundle;
    let schemaConfig = {
        toObject: {
            getters: true
        },
        toJSON: {
            getters: true
        },
        versionKey: false
    };
    if (process.env.MONGODB_IS_SHARDING_MODE == "true") {
        schemaConfig["shardKey"] = {
            id: 1
        };
    }
    const BundleSchema = new mongoose.Schema(Bundle, schemaConfig);


    BundleSchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        if (_.get(result, "myCollection")) {
            let tempCollectionField = _.cloneDeep(result["myCollection"]);
            _.set(result, "collection", tempCollectionField);
        }
        return result;
    };

    BundleSchema.pre('save', async function(next) {
        let mongodb = require('../index');
        if (process.env.ENABLE_CHECK_ALL_RESOURCE_ID == "true") {
            let storedID = await mongodb.FHIRStoredID.findOne({
                id: this.id
            });
            if (storedID.resourceType == "Bundle") {
                const docInHistory = await mongodb.Bundle_history.findOne({
                        id: this.id
                    })
                    .sort({
                        "meta.versionId": -1
                    });
                let versionId = Number(_.get(docInHistory, "meta.versionId")) + 1;
                let versionIdStr = String(versionId);
                _.set(this, "meta.versionId", versionIdStr);
                _.set(this, "meta.lastUpdated", new Date());
            } else {
                console.error('err', storedID);
                return next(new Error(`The id->${this.id} stored by resource ${storedID.resourceType}`));
            }
        } else {
            _.set(this, "meta.versionId", "1");
            _.set(this, "meta.lastUpdated", new Date());
        }
        return next();
    });

    BundleSchema.post('save', async function(result) {
        let mongodb = require('../index');
        let item = result.toObject();
        delete item._id;
        let version = item.meta.versionId;
        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : `:${process.env.FHIRSERVER_PORT}`;
        if (version == "1") {
            _.set(item, "request", {
                "method": "POST",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/Bundle/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "201"
            });
            let createdDocs = await mongodb['Bundle_history'].create(item);
        } else {
            _.set(item, "request", {
                "method": "PUT",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/Bundle/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "200"
            });
            let createdDocs = await mongodb['Bundle_history'].create(item);
        }
        await mongodb.FHIRStoredID.findOneAndUpdate({
            id: result.id
        }, {
            id: result.id,
            resourceType: "Bundle"
        }, {
            upsert: true
        });
    });

    BundleSchema.pre('findOneAndUpdate', async function(next) {
        const docToUpdate = await this.model.findOne(this.getFilter());
        let version = Number(docToUpdate.meta.versionId);
        this._update.$set.meta = docToUpdate.meta;
        this._update.$set.meta.versionId = String(version + 1);
        this._update.$set.meta.lastUpdated = new Date();
        return next();
    });

    BundleSchema.post('findOneAndUpdate', async function(result) {
        let mongodb = require('../index');
        let item;
        if (result.value) {
            item = _.cloneDeep(result.value).toObject();
        } else {
            item = _.cloneDeep(result).toObject();
        }
        let version = item.meta.versionId;
        delete item._id;
        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : `:${process.env.FHIRSERVER_PORT}`;

        _.set(item, "request", {
            "method": "PUT",
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/Bundle/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });

        try {
            let history = await mongodb['Bundle_history'].create(item);
        } catch (e) {
            console.error(e);
        }
        return result;
    });

    BundleSchema.pre('findOneAndDelete', async function(next) {
        const docToDelete = await this.model.findOne(this.getFilter());
        if (!docToDelete) {
            next(`The id->${this.getFilter().id} not found in Bundle resource`);
        }
        let mongodb = require('../index');
        let item = docToDelete.toObject();
        delete item._id;
        item.meta.versionId = String(Number(item.meta.versionId) + 1);
        let version = item.meta.versionId;

        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : `:${process.env.FHIRSERVER_PORT}`;
        _.set(item, "request", {
            "method": "DELETE",
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/Bundle/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });
        let createdDocs = await mongodb['Bundle_history'].create(item);
        next();
    });

    BundleSchema.index({"$**": "text"});

    const BundleModel = mongoose.model("Bundle", BundleSchema, "Bundle");
    return BundleModel;
};