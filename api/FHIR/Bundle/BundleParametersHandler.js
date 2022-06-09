const _ = require('lodash');
const queryBuild = require('../../../models/FHIR/queryBuild.js');
const queryHandler = require('../../../models/FHIR/searchParameterQueryHandler');

let paramsSearchFields = {};

const paramsSearch = {
    "_id": (query) => {
        query.$and.push({
            id: query["_id"]
        });
        delete query["_id"];
    }
};

paramsSearch["_lastUpdated"] = (query) => {
    if (!_.isArray(query["_lastUpdated"])) {
        query["_lastUpdated"] = [query["_lastUpdated"]];
    }
    for (let i in query["_lastUpdated"]) {
        let buildResult = queryBuild.instantQuery(query["_lastUpdated"][i], "meta.lastUpdated");
        if (!buildResult) {
            throw new Error(`invalid date: ${query["_lastUpdated"]}`);
        }
        query.$and.push(buildResult);
    }
    delete query["_lastUpdated"];
};

paramsSearch["_text"] = (query) => {
    if (!_.isArray(query["_text"])) {
        query["_text"] = [query["_text"]];
    }
    for (let i in query["_text"]) {
        let queryValue = query["_text"][i];
        let mongoQ = {
            $text: {
                $search: queryValue
            }
        };
        query.$and.push(mongoQ);
    }
};

//#region composition
paramsSearchFields["composition"] = ["entry[0].resource.reference"];
paramsSearch["composition"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "composition");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region identifier
paramsSearchFields["identifier"] = ["identifier"];
paramsSearch["identifier"] = (query) => {
    try {
        queryHandler.getTokenQuery(query, paramsSearchFields, "identifier");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region message
paramsSearchFields["message"] = ["entry[0].resource.reference"];
paramsSearch["message"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "message");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region timestamp
paramsSearchFields["timestamp"] = ["timestamp"];
const timestampSearchFunc = {};
timestampSearchFunc["timestamp"] = (value, field) => {
    return queryBuild.instantQuery(value, field);
};

paramsSearch["timestamp"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "timestamp", timestampSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region type
paramsSearchFields["type"] = ["type"];
const typeSearchFunc = {};
typeSearchFunc["type"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["type"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "type", typeSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;