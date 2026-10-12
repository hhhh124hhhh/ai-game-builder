#!/usr/bin/env node
/**
 * ai-game-builder CLI — 一句话把网页小游戏从想法变成可玩文件。
 *
 * 用法：
 *   OPENAI_API_KEY=xxx ai-game-builder generate "做个2048合并游戏" --template 2d --out ./my-game
 *
 * 环境变量：
 *   OPENAI_API_KEY   必需（OpenRouter 或任何 OpenAI 兼容网关的 key）
 *   OPENAI_BASE_URL  可选，默认 https://openrouter.ai/api/v1
 *   AIGB_MODEL       可选；不填则自动选第一个 :free 模型
 *
 * 零依赖，只用 Node 18+ 自带 fetch。
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const BASE_URL = process.env.OPENAI_BASE_URL || "https://openrouter.ai/api/v1";

function loadTemplate(kind) {
  const spec = readFileSync(join(ROOT, "references", `template-${kind}.md`), "utf8");
  let shell = readFileSync(join(ROOT, "templates", "index.html"), "utf8");
  return { spec, shell };
}

function detectTemplate(desc, flag) {
  if (flag && flag !== "auto") return flag;
  return /3d|三维|three\.?js/i.test(desc) ? "3d" : "2d";
}

function buildPrompt(desc, kind, title) {
  const { spec } = loadTemplate(kind);
  const filesHint = kind === "2d"
    ? "只输出一个文件：main.js（全部游戏逻辑，单文件）。"
    : "输出多个文件：main.js（含 class Game 入口）+ 按职责拆分的 Manager 文件（Player.js / EnemyManager.js / PowerupManager.js / InputController.js，按需增减，上限 6 个）。main.js 用 ES module import 引用它们。";
  return `You are an expert web game code generator. Generate a complete, playable browser game from the description below.

GAME DESCRIPTION: ${desc}

Follow this scaffold specification EXACTLY (chapter order must not change):
---
${spec}
---

OUTPUT RULES (strict):
1. ${filesHint}
2. Output ONLY file blocks, each wrapped EXACTLY like this (no markdown fences, no explanations, no text outside blocks):
=== FILE: main.js ===
<code here>
=== END FILE ===
3. The game title is "${title}". Do not generate index.html (it is provided by the toolchain).
4. Code must run as-is: no placeholders, no TODOs, no external assets except Google Fonts.
5. Mobile-first: centered 520px column on wide screens, DPR capped at 2, 28px swipe threshold.
6. Juice is mandatory: particles, screen shake, floating score text, combo system (at least 3 kinds).
7. All platform hooks must use optional chaining (e.g. window.GameBridge?.logProgress(...)) so the game runs standalone.`;
}

async function pickFreeModel(apiKey) {
  const r = await fetch(`${BASE_URL}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!r.ok) throw new Error(`models 接口失败: ${r.status}`);
  const j = await r.json();
  const free = (j.data || []).find((m) => m.id.endsWith(":free"));
  if (!free) throw new Error("该网关没有 :free 模型，请用 --model 指定");
  return free.id;
}

async function chat(apiKey, model, prompt) {
  const r = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/hhhh124hhhh/ai-game-builder",
      "X-Title": "ai-game-builder",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });
  if (!r.ok) throw new Error(`生成失败: ${r.status} ${await r.text().then((t) => t.slice(0, 200))}`);
  const j = await r.json();
  return j.choices[0].message.content;
}

function parseFiles(text) {
  const files = {};
  const re = /=== FILE: (.+?) ===\r?\n([\s\S]*?)=== END FILE ===/g;
  let m;
  while ((m = re.exec(text))) {
    files[m[1].trim()] = m[2].replace(/\n$/, "");
  }
  return files;
}

function buildIndexHtml(kind, title) {
  let shell = readFileSync(join(ROOT, "templates", "index.html"), "utf8");
  shell = shell.replace("GAME_TITLE", title);
  if (kind === "3d") {
    shell = shell.replace(
      "<!-- IMPORTMAP -->",
      `<script type="importmap">{"imports":{"three":"https://esm.sh/three@0.160.0","three/":"https://esm.sh/three@0.160.0/"}}</script>`
    );
  } else {
    shell = shell.replace("<!-- IMPORTMAP -->\n", "");
  }
  return shell;
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const k = a.slice(2);
      args[k] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    } else args._.push(a);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];

  if (args["print-prompt"] !== undefined) {
    const desc = typeof args["print-prompt"] === "string" ? args["print-prompt"] : "测试游戏";
    const kind = detectTemplate(desc, args.template);
    process.stdout.write(buildPrompt(desc, kind, args.title || "My Game"));
    return;
  }

  if (args["parse-only"] !== undefined) {
    const text = readFileSync(args["parse-only"], "utf8");
    const files = parseFiles(text);
    const out = args.out || "./out";
    mkdirSync(out, { recursive: true });
    for (const [name, content] of Object.entries(files)) {
      writeFileSync(join(out, name), content);
      console.log(`wrote ${name} (${content.length} bytes)`);
    }
    if (!Object.keys(files).length) {
      console.error("未解析到文件块，检查模型输出格式");
      process.exit(1);
    }
    return;
  }

  if (cmd !== "generate") {
    console.log(`用法:
  ai-game-builder generate "游戏描述" [--template 2d|3d|auto] [--out ./dir] [--title 标题] [--model id]
  ai-game-builder --print-prompt "游戏描述"   # 只打印 prompt（调试）
  ai-game-builder --parse-only output.txt --out ./dir  # 只解析模型输出（调试）

环境变量: OPENAI_API_KEY（必需）, OPENAI_BASE_URL（可选）, AIGB_MODEL（可选）`);
    process.exit(cmd ? 1 : 0);
  }

  const desc = args._[1];
  if (!desc) { console.error("请提供游戏描述"); process.exit(1); }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) { console.error("请设置 OPENAI_API_KEY"); process.exit(1); }

  const kind = detectTemplate(desc, args.template);
  const title = args.title || desc.slice(0, 20);
  const out = args.out || "./game-out";
  console.log(`模板: ${kind} | 输出: ${out}`);

  const model = args.model || process.env.AIGB_MODEL || await pickFreeModel(apiKey);
  console.log(`模型: ${model}`);

  const prompt = buildPrompt(desc, kind, title);
  console.log("生成中...");
  const text = await chat(apiKey, model, prompt);
  const files = parseFiles(text);
  if (!Object.keys(files).length) {
    writeFileSync(join("/tmp", "aigb-raw.txt"), text);
    console.error("模型未按格式输出，原文存 /tmp/aigb-raw.txt");
    process.exit(1);
  }

  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "index.html"), buildIndexHtml(kind, title));
  console.log("wrote index.html");
  for (const [name, content] of Object.entries(files)) {
    if (name.includes("..") || name.startsWith("/")) throw new Error(`非法文件名: ${name}`);
    writeFileSync(join(out, name), content);
    console.log(`wrote ${name} (${content.length} bytes)`);
  }
  console.log(`\n完成！用浏览器打开 ${out}/index.html 试玩`);
}

main().catch((e) => { console.error("出错:", e.message); process.exit(1); });
