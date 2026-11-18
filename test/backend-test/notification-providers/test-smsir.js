const { describe, test, beforeEach, afterEach, mock } = require("node:test");
const assert = require("node:assert");
const axios = require("axios");

const SMSIR = require("../../../server/notification-providers/smsir");

describe("SMSIR notification provider", () => {
    let requestedMobiles;
    let reply;

    beforeEach(() => {
        requestedMobiles = [];
        reply = null;
        mock.method(axios, "post", async (url, data) => {
            requestedMobiles.push(data.mobile);
            // Answer after the current tick, like a real request
            await new Promise((resolve) => setTimeout(resolve, 10));
            if (reply) {
                throw reply;
            }
            return { status: 200, data: { status: 1 } };
        });
    });

    afterEach(() => mock.restoreAll());

    const notification = { smsirApiKey: "key", smsirNumber: "09120000000,09130000000", smsirTemplate: "123" };

    test("send() sends to every number and resolves when the API accepts them", async () => {
        assert.strictEqual(await new SMSIR().send(notification, "Test"), "Sent Successfully.");
        assert.deepStrictEqual(requestedMobiles, ["9120000000", "9130000000"]);
    });

    test("send() throws when the API rejects the request", async () => {
        const error = new Error("Request failed with status code 401");
        error.response = { status: 401, data: { status: 10, message: "invalid api key" } };
        reply = error;

        await assert.rejects(new SMSIR().send(notification, "Test"), /Request failed with status code 401/);
    });
});
