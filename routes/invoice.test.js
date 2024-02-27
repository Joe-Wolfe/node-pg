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

describe("GET /invoices", function () {
    test("Gets a list of 1 invoice", async function () {
        const response = await request(app).get(`/invoices`);
        expect(response.body).toEqual({
            invoices: [{ id: testInvoice.rows[0].id, comp_code: 'apple' }]
        });
    });
});

describe("GET /invoices/:id", function () {
    test("Gets a single invoice", async function () {
        const response = await request(app).get(`/invoices/${testInvoice.rows[0].id}`);
        expect(response.body).toEqual({
            invoice: {
                id: testInvoice.rows[0].id,
                company: {
                    code: "apple",
                    description: "Maker of OSX.",
                    name: "Apple Computer",
                },
                amt: 100,
                paid: false,
                add_date: '2018-01-01T05:00:00.000Z',
                paid_date: null
            }
        });
    });

    test("Responds with 404 if can't find invoice", async function () {
        const response = await request(app).get(`/invoices/0`);
        expect(response.status).toEqual(404);
    });
});

describe("POST /invoices", function () {
    test("Creates a new invoice", async function () {
        const response = await request(app)
            .post(`/invoices`)
            .send({ comp_code: 'apple', amt: 100 });
        expect(response.status).toEqual(201);
        expect(response.body).toEqual({
            invoice: {
                id: expect.any(Number),
                comp_code: 'apple',
                amt: 100,
                paid: false,
                add_date: expect.any(String),
                paid_date: null
            }
        });
    });
});

describe("PUT /invoices/:id", function () {
    test("Updates a single invoice", async function () {
        const response = await request(app)
            .put(`/invoices/${testInvoice.rows[0].id}`)
            .send({ amt: 200 });
        expect(response.body).toEqual({
            invoice: {
                id: testInvoice.rows[0].id,
                comp_code: 'apple',
                amt: 200,
                paid: false,
                add_date: expect.any(String),
                paid_date: null
            }
        });
    });

    test("Responds with 404 if can't find invoice", async function () {
        const response = await request(app).put(`/invoices/0`);
        expect(response.status).toEqual(404);
    });
});

describe("DELETE /invoices/:id", function () {
    test("Deletes a single invoice", async function () {
        const response = await request(app)
            .delete(`/invoices/${testInvoice.rows[0].id}`);
        expect(response.body).toEqual({ status: "deleted" });
    });
});