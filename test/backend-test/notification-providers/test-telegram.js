const { describe, test, beforeEach, afterEach, mock } = require("node:test");
const assert = require("node:assert");
const axios = require("axios");

const Telegram = require("../../../server/notification-providers/telegram");

describe("Telegram notification provider", () => {
    let sent;

    beforeEach(() => {
        sent = [];
        mock.method(axios, "post", async (url, data) => {
            sent.push(data);
            return { status: 200, data: { ok: true } };
        });
    });

    afterEach(() => mock.restoreAll());

    const notification = {
        telegramBotToken: "token",
        telegramChatID: "1",
        telegramUseTemplate: true,
        telegramTemplateParseMode: "MarkdownV2",
        telegramTemplate: "*{{ name }}*: {{ msg }}",
    };

    test("escapeMarkdownV2() escapes every character reserved by MarkdownV2", () => {
        assert.strictEqual(
            new Telegram().escapeMarkdownV2("_*[]()~`>#+-=|{}.!\\"),
            "\\_\\*\\[\\]\\(\\)\\~\\`\\>\\#\\+\\-\\=\\|\\{\\}\\.\\!\\\\"
        );
    });

    test("send() escapes backticks in a MarkdownV2 template", async () => {
        await new Telegram().send(
            notification,
            "Table `db`.`users` doesn't exist",
            { name: "`db` check" },
            { msg: "" }
        );

        assert.strictEqual(sent[0].parse_mode, "MarkdownV2");
        assert.strictEqual(sent[0].text, "*\\`db\\` check*: Table \\`db\\`\\.\\`users\\` doesn't exist");
    });
});
