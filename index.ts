import { Hono } from "hono";
import ky from "ky";

import { formatJSON } from "./utils.ts";

const app = new Hono();

app.get("/", (c) => {
  return c.html(`
    <body>
      Go to <a href="https://github.com/geekdada/telegram-incoming-webhook">
      telegram-incoming-webhook
      </a>
    </body>
  `);
});

app.get("/:botToken/chats", async (c) => {
  const botToken = c.req.param("botToken");

  const tgResponse = await ky
    .get(`https://api.telegram.org/bot${botToken}/getUpdates?limit=10`)
    .json<{
      ok: boolean;
      result: Array<{
        update_id: number;
      }>;
    }>();

  return c.text(
    tgResponse.result
      .map((v) => JSON.stringify(v))
      .join("\n"),
  );
});

app.post("/:botToken/:chatId", async (c) => {
  const botToken = c.req.param("botToken");
  const chatId = c.req.param("chatId");

  const parseMode =
    c.req.query("parse_mode") ??
    "HTML";

  const body = await c.req.text();

  let formattedBody = body;

  try {
    formattedBody = formatJSON(JSON.parse(body));
  } catch {
    // body не JSON
  }

  const response = await ky.post(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      json: {
        chat_id: chatId,
        text: formattedBody,
        parse_mode: parseMode,
      },
    },
  );

  return c.json(await response.json());
});

console.log("Server started");

Deno.serve(app.fetch);
