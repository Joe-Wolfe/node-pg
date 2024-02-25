const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

//GET /invoices :** Return info on invoices: like `{invoices: [{id, comp_code}, ...]}`
router.get("/", async function (req, res, next) {
    try {
        const result = await db.query(
            `SELECT id, comp_code 
             FROM invoices`
        );
        return res.json({ invoices: result.rows });
    } catch (err) {
        return next(err);
    }
});

//GET /invoices/[id] :** Returns obj on given invoice.
//If invoice cannot be found, returns 404. Returns `{invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}`
router.get("/:id", async function (req, res, next) {
    try {
        let id = req.params.id;

        const invResult = await db.query(
            `SELECT id, amt, paid, add_date, paid_date, comp_code
             FROM invoices 
             WHERE id = $1`,
            [id]
        );

        if (invResult.rows.length === 0) {
            throw new ExpressError(`No such invoice: ${id}`, 404);
        }

        const invoice = invResult.rows[0];

        const compResult = await db.query(
            `SELECT code, name, description 
             FROM companies 
             WHERE code = $1`,
            [invoice.comp_code]
        );

        invoice.company = compResult.rows[0];
        delete invoice.comp_code;

        return res.json({ "invoice": invoice });
    } catch (err) {
        return next(err);
    }
});

//POST /invoices :** Adds an invoice. Needs to be passed in JSON body of: `{comp_code, amt}`
//Returns: `{invoice: {id, comp_code, amt, paid, add_date, paid_date}}`

router.post("/", async function (req, res, next) {
    try {
        let { comp_code, amt } = req.body;

        const result = await db.query(
            `INSERT INTO invoices (comp_code, amt) 
             VALUES ($1, $2) 
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [comp_code, amt]
        );

        return res.status(201).json({ invoice: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

//PUT /invoices/[id] :** Updates an invoice. If invoice cannot be found, returns a 404.
//Needs to be passed in a JSON body of `{amt}` Returns: `{invoice: {id, comp_code, amt, paid, add_date, paid_date}}`

router.put("/:id", async function (req, res, next) {
    try {
        let { amt } = req.body;
        let id = req.params.id;

        const result = await db.query(
            `UPDATE invoices 
             SET amt=$1
             WHERE id=$2
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [amt, id]
        );

        if (result.rows.length === 0) {
            throw new ExpressError(`No such invoice: ${id}`, 404);
        }

        return res.json({ invoice: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

//DELETE /invoices/[id] :** Deletes an invoice.If invoice cannot be found, 
//returns a 404. Returns: `{status: "deleted"}` 

router.delete("/:id", async function (req, res, next) {
    try {
        let id = req.params.id;

        const result = await db.query(
            `DELETE FROM invoices 
             WHERE id = $1
             RETURNING id`,
            [id]
        );

        if (result.rows.length === 0) {
            throw new ExpressError(`No such invoice: ${id}`, 404);
        }

        return res.json({ status: "deleted" });
    } catch (err) {
        return next(err);
    }
});






module.exports = router;