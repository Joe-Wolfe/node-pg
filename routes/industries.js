const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

//GET /industries : Returns list of industries, like {industries: [{code, industry}, ...]}
router.get("/", async function (req, res, next) {
    try {
        const result = await db.query(
            `SELECT code, industry FROM industries`
        );
        return res.json({ industries: result.rows });
    } catch (err) {
        return next(err);
    }
});

//GET /industries/[code] : Returns obj of industry: {industry: {code, industry, companies: [{code, name}, ...]}}
// If the industry given cannot be found, this should return a 404 status response.

router.get("/:code", async function (req, res, next) {
    try {
        let code = req.params.code;

        const indResult = await db.query(
            `SELECT code, industry 
             FROM industries 
             WHERE code = $1`,
            [code]
        );

        if (indResult.rows.length === 0) {
            throw new ExpressError(`No such industry: ${code}`, 404);
        }

        const industry = indResult.rows[0];

        const compResult = await db.query(
            `SELECT code, name 
             FROM companies 
             WHERE code IN (SELECT comp_code FROM company_industries WHERE ind_code = $1)`,
            [code]
        );

        industry.companies = compResult.rows;

        return res.json({ "industry": industry });
    } catch (err) {
        return next(err);
    }
});

//POST /industries : Adds an industry. Needs to be passed in JSON body of: `{code, industry}`
// Returns: `{industry: {code, industry}}`

router.post("/", async function (req, res, next) {
    try {
        let { code, industry } = req.body;

        const result = await db.query(
            `INSERT INTO industries (code, industry) 
             VALUES ($1, $2) 
             RETURNING code, industry`,
            [code, industry]
        );

        return res.status(201).json({ industry: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

//POST /industries/[code]/companies/[comp_code] : Adds a company to an industry. Needs to be passed in JSON body of: `{comp_code}`
// Returns: `{industry: {code, industry, companies: [{code, name}, ...]}}`
router.post("/:code/companies/:comp_code", async function (req, res, next) {
    try {
        let { code, comp_code } = req.params;

        const result = await db.query(
            `INSERT INTO company_industries (comp_code, ind_code) 
             VALUES ($1, $2) 
             RETURNING comp_code, ind_code`,
            [comp_code, code]
        );

        if (result.rows.length === 0) {
            throw new ExpressError(`No such industry: ${code}`, 404);
        }

        const indResult = await db.query(
            `SELECT code, industry 
             FROM industries 
             WHERE code = $1`,
            [code]
        );

        const industry = indResult.rows[0];

        const compResult = await db.query(
            `SELECT code, name 
             FROM companies 
             WHERE code IN (SELECT comp_code FROM company_industries WHERE ind_code = $1)`,
            [code]
        );

        industry.companies = compResult.rows;

        return res.json({ "industry": industry });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;