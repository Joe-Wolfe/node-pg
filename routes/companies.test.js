process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testCompany;
let testInvoice;

beforeEach(async function () {
    await db.query("DELETE FROM companies");
    await db.query("DELETE FROM invoices");
    testCompany = await db.query(`INSERT INTO companies (code, name, description) VALUES ('apple', 'Apple Computer', 'Maker of OSX.') RETURNING code, name, description`);
    testInvoice = await db.query(`INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date) VALUES ('apple', 100, false, '2018-01-01', null) RETURNING id, comp_code, amt, paid, add_date, paid_date`);

});

afterAll(async function () {
    await db.end();
});

describe("GET /companies", function () {
    test("Gets a list of 1 company", async function () {
        const response = await request(app).get(`/companies`);
        expect(response.body).toEqual({
            companies: [{ code: 'apple', name: 'Apple Computer' }]
        });
    });
});

describe("GET /companies/:code", function () {
    test("Gets a single company", async function () {
        const response = await request(app).get(`/companies/apple`);
        expect(response.body).toEqual({
            company: {
                code: 'apple',
                name: 'Apple Computer',
                description: 'Maker of OSX.',
                invoices: [testInvoice.rows[0].id]
            }
        });
    });

    test("Responds with 404 if can't find company", async function () {
        const response = await request(app).get(`/companies/0`);
        expect(response.status).toEqual(404);
    });
});

describe("POST /companies", function () {
    test("Creates a new company", async function () {
        const response = await request(app)
            .post(`/companies`)
            .send({ code: 'tesla', name: 'Tesla', description: 'Maker of electric cars.' });
        expect(response.status).toEqual(201);
        expect(response.body).toEqual({
            company: { code: 'tesla', name: 'Tesla', description: 'Maker of electric cars.' }
        });
    });
});

describe("PUT /companies/:code", function () {
    test("Updates a single company", async function () {
        const response = await request(app)
            .put(`/companies/apple`)
            .send({ name: 'Apple Computer Inc.', description: 'Maker of OSX.' });
        expect(response.body).toEqual({
            company: { code: 'apple', name: 'Apple Computer Inc.', description: 'Maker of OSX.' }
        });
    });

    test("Responds with 404 if can't find company", async function () {
        const response = await request(app).put(`/companies/0`);
        expect(response.status).toEqual(404);
    });
});

describe("DELETE /companies/:code", function () {
    test("Deletes a single a company", async function () {
        const response = await request(app).delete(`/companies/apple`);
        expect(response.body).toEqual({ status: "deleted" });
    });
});