const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const FHIR = require('fhir').Fhir;
const {
    handleError
} = require('../../../models/FHIR/httpMessage');
const _ = require('lodash');
const config = require('../../../config/config');
const user = require('../../APIservices/user.service.js');

function setFormatWhenQuery(req, res) {
    let format = _.get(req, "query._format");
    if (format && format.includes("xml")) {
        res.set('Content-Type', 'application/fhir+xml');
    } else if (format && format.includes("json")) {
        res.set('Content-Type', 'application/fhir+json');
    }
    delete req['query']['_format'];
}

router.use((req, res, next) => {
    try {
        if (req.headers["content-type"]) {
            if (req.headers["content-type"].includes("xml")) {
                res.set('Content-Type', 'application/fhir+xml');
                if (req.method == "POST" || req.method == "PUT") {
                    let Fhir = new FHIR();
                    req.body = Fhir.xmlToObj(req.body);
                }
            }
        }
        _.get(req.headers, "accept") ? "" : (() => {
            _.get(req.headers, "content-type") ? _.set(req.headers, "accept", _.get(req.headers, "content-type")) : _.set(req.headers, "accept", "application/fhir+json");
        })();
        if (req.headers.accept.includes("xml")) {
            res.set('Content-Type', 'application/fhir+xml');
        } else {
            res.set('Content-Type', 'application/fhir+json');
        }
        setFormatWhenQuery(req, res);
        next();
    } catch (e) {
        return res.send(handleError.exception(e));
    }
});

if (process.env.ENABLE_TOKEN_AUTH == "true") {
    router.use(user.tokenAuthentication);
}

if (_.get(config, "Bundle.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getBundle'));
}

if (_.get(config, "Bundle.interaction.read", true)) {
    router.get('/:id', require('./controller/getBundleById'));
}

if (_.get(config, "Bundle.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getBundleHistory'));
}

if (_.get(config, "Bundle.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getBundleHistoryById'));
}

if (_.get(config, "Bundle.interaction.create", true)) {
    router.post('/', require('./controller/postBundle'));
}

router.post('/([\$])validate', require('./controller/postBundleValidate'));

if (_.get(config, "Bundle.interaction.update", true)) {
    router.put('/:id', require("./controller/putBundle"));
}

if (_.get(config, "Bundle.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteBundle"));
    router.delete('/', require("./controller/condition-deleteBundle"));
}

module.exports = router;