const uuid = require('uuid');
const moment = require('moment');
const _ = require('lodash');
const fs = require('fs');

const fhirUrl = "http://hl7.org/fhir/R4";

module.exports = async function(req, res) {
    const metaData = {
        "resourceType": "CapabilityStatement",
        "status": "active",
        "date": moment.utc().toDate(),
        "publisher": "Not provided",
        "kind": "instance",
        "software": {
            "name": "FHIR-Server Burni",
            "version": "1.0.0"
        },
        "implementation": {
            "description": "Burni FHIR R4 Server",
            "url": `http://localhost/fhir`
        },
        "fhirVersion": "4.0.1",
        "format": ["json"],
        "rest": [{
            "mode": "server",
            "resource": [{
                    "type": "Bundle",
                    "profile": "http://hl7.org/fhir/R4/bundle.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Patient",
                    "profile": "http://hl7.org/fhir/R4/patient.html",
                    "interaction": [],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                }
            ]
        }]
    };
    res.json(metaData);
};