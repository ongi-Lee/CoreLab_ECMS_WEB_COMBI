// Node 24+: node --test create_c/tests/api.test.mjs
// Fetch, the clock and timers are mocked: no API calls or generation charges.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const promptResult = { koreanPrompt: '토끼가 춤춰요.', englishPrompt: 'A rabbit dancing in a forest.' };
const geminiResult = { candidates: [{ content: { parts: [{ text: JSON.stringify(promptResult) }] } }] };
const json = (body, status = 200, headers = {}) =>
    new Response(JSON.stringify(body), { status, headers });

function serverHarness(sequence, env = {}) {
    let now = 0;
    let handler;
    const calls = [];
    const waits = [];
    class Clock extends Date { static now() { return now; } }
    const context = vm.createContext({
        Response, Date: Clock,
        AbortSignal: { timeout: () => new AbortController().signal },
        console: { warn() {}, error() {} },
        setTimeout(resolve, delay) { waits.push(delay); now += delay; resolve(); },
        fetch: async (...args) => {
            calls.push(args);
            const value = sequence.shift();
            if (value instanceof Error) throw value;
            assert.ok(value, 'Unexpected extra upstream request');
            return value;
        },
        Deno: {
            env: { get: key => ({ GEMINI_API_KEY: 'test-key', GEMINI_IMAGE_API_KEY: 'image-key', ...env })[key] },
            serve: callback => { handler = callback; },
        },
    });
    vm.runInContext(stripTypeScriptTypes(
        read('supabase/functions/_shared/gemini.ts').replace(/^export /gm, ''),
        { mode: 'transform' },
    ), context);
    return {
        calls, waits, context,
        load(kind) {
            vm.runInContext(stripTypeScriptTypes(
                read(`supabase/functions/generate-${kind}/index.ts`).replace(/^import .*;\n/m, ''),
                { mode: 'transform' },
            ), context);
        },
        invoke(body, method = 'POST') {
            return handler(new Request('https://example.test', {
                method,
                ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
            }));
        },
    };
}

test('503 then success: prompt is generated after bounded backoff', async () => {
    const h = serverHarness([json({}, 503), json(geminiResult)]);
    h.load('prompt');
    const response = await h.invoke({ character: '토끼', background: '숲 속', action: '춤추기' });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), promptResult);
    assert.equal(h.calls.length, 2);
    assert.ok(h.waits[0] >= 1000 && h.waits[0] < 2000);
    assert.ok(!h.calls[0][0].includes('test-key'));
    assert.equal(h.calls[0][1].headers['x-goog-api-key'], 'test-key');
});

test('persistent 503 stays 503 with CORS, a friendly error and exactly four attempts', async () => {
    const h = serverHarness(Array.from({ length: 4 }, () => json({ secret: 'internal-details' }, 503)));
    h.load('prompt');
    const response = await h.invoke({ character: '토끼', background: '숲', action: '춤' });
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
    assert.equal(body.upstreamStatus, 503);
    assert.equal(body.attempts, 4);
    assert.equal(body.retriesExhausted, true);
    assert.ok(!JSON.stringify(body).includes('internal-details'));
    assert.equal(h.calls.length, 4);
    assert.equal(h.waits.length, 3);
});

test('429 respects Retry-After; long quota resets are not retried early', async () => {
    const h = serverHarness([json({}, 429, { 'Retry-After': '2' }), json(geminiResult)]);
    h.load('prompt');
    assert.equal((await h.invoke({ character: '토끼', background: '숲', action: '춤' })).status, 200);
    assert.deepEqual(h.waits, [2000]);
    const long = serverHarness([json({}, 429, { 'Retry-After': '3600' })]);
    long.load('prompt');
    assert.equal((await long.invoke({ character: '토끼', background: '숲', action: '춤' })).status, 429);
    assert.equal(long.calls.length, 1);
    assert.equal(long.waits.length, 0);
});

for (const status of [400, 401, 402, 403, 404]) {
    test(`upstream ${status} is not retried and retains diagnostic status`, async () => {
        const h = serverHarness([json({}, status)]);
        h.load('prompt');
        const response = await h.invoke({ character: '토끼', background: '숲', action: '춤' });
        assert.equal(response.status, 502);
        assert.equal((await response.json()).upstreamStatus, status);
        assert.equal(h.calls.length, 1);
    });
}

test('network failure is not replayed', async () => {
    const h = serverHarness([new Error('socket disconnected')]);
    h.load('image');
    const response = await h.invoke({ prompt: 'A rabbit' });
    assert.equal(response.status, 504);
    assert.equal((await response.json()).retryable, false);
    assert.equal(h.calls.length, 1);
});

test('input validation, OPTIONS and missing key never call Gemini', async () => {
    const h = serverHarness([], { GEMINI_API_KEY: undefined });
    h.load('prompt');
    assert.equal((await h.invoke({}, 'OPTIONS')).status, 200);
    assert.equal((await h.invoke({}, 'GET')).status, 405);
    assert.equal((await h.invoke({ character: {}, background: '숲', action: '춤' })).status, 400);
    assert.equal((await h.invoke({ character: '토끼', background: '숲', action: '춤' })).status, 500);
    assert.equal(h.calls.length, 0);
});

test('incomplete prompt JSON is not returned as a successful generation', async () => {
    const h = serverHarness([json({ candidates: [{ content: { parts: [{ text: '{}' }] } }] })]);
    h.load('prompt');
    assert.equal((await h.invoke({ character: '토끼', background: '숲', action: '춤' })).status, 502);
});

test('text and image model overrides are separate; thought images are ignored', async () => {
    const h = serverHarness([json({ candidates: [{ content: { parts: [
        { thought: true, inlineData: { data: 'thought-image', mimeType: 'image/png' } },
        { inlineData: { data: 'final-image', mimeType: 'image/png' } },
    ] } }] })], { GEMINI_TEXT_MODEL: 'text-only', GEMINI_IMAGE_MODEL: 'image-model' });
    h.load('image');
    const response = await h.invoke({ prompt: 'A rabbit' });
    assert.deepEqual(await response.json(), { imageBytes: 'final-image', mimeType: 'image/png' });
    assert.ok(h.calls[0][0].includes('/image-model:generateContent'));
    assert.equal(h.calls[0][1].headers['x-goog-api-key'], 'image-key');
});

test('a text-only image response is an error, not a sample success', async () => {
    const h = serverHarness([json(geminiResult)]);
    h.load('image');
    assert.equal((await h.invoke({ prompt: 'A rabbit' })).status, 502);
});

const script = read('script.js');
function clientHarness(sequence) {
    let calls = 0;
    const context = vm.createContext({
        SUPABASE_URL: 'https://example.test', SUPABASE_ANON_KEY: 'public-test-key',
        getLang: () => 'ko', setTimeout: resolve => resolve(),
        fetch: async () => {
            calls++;
            const value = sequence.shift();
            if (value instanceof Error) throw value;
            assert.ok(value, 'Unexpected browser retry');
            return value;
        },
    });
    const start = script.indexOf('async function callEdgeFunction(');
    const end = script.indexOf("createPromptBtn.addEventListener('click'", start);
    vm.runInContext(script.slice(start, end), context);
    return { invoke: (name = 'generate-prompt') => context.callEdgeFunction(name, {}), calls: () => calls };
}

test('browser retries the observed legacy 500-wrapped-503 without redoing quota RPC', async () => {
    const h = clientHarness([json({ error: 'Gemini API 오류: {"error":{"code":503}}' }, 500), json(promptResult)]);
    assert.deepEqual(await h.invoke(), promptResult);
    assert.equal(h.calls(), 2);
});

test('browser never multiplies server retries; legacy retries stop after three attempts', async () => {
    const h = clientHarness([json({ error: 'busy', upstreamStatus: 503, retriesExhausted: true }, 503)]);
    await assert.rejects(h.invoke(), /요청이 몰리고/);
    assert.equal(h.calls(), 1);
    const legacy = clientHarness(Array.from({ length: 3 }, () =>
        json({ error: 'Gemini API 오류: {"error":{"code":503}}' }, 500)));
    await assert.rejects(legacy.invoke(), /요청이 몰리고/);
    assert.equal(legacy.calls(), 3);
});

test('browser does not replay ambiguous network failures or accept incomplete success', async () => {
    const network = clientHarness([new Error('connection lost')]);
    await assert.rejects(network.invoke(), /connection lost/);
    assert.equal(network.calls(), 1);
    const incomplete = clientHarness([json({})]);
    await assert.rejects(incomplete.invoke(), /응답이 완성되지/);
});

test('failed second image does not create a sample or crash when no previous comparison exists', async () => {
    const errors = [];
    let opened = false;
    let handler;
    const element = { textContent: '', setAttribute() {}, removeAttribute() {}, querySelector() { return element; } };
    const context = vm.createContext({
        localStorage: { getItem: () => '' }, getLang: () => 'ko', STATIC_I18N: { ko: {} },
        hideError() {}, showError: error => errors.push(error),
        document: { getElementById: () => element }, imageLoadingBox: element,
        compareGenerateBtn: { ...element, addEventListener: (_event, callback) => { handler = callback; } },
        compareState: { first: { character: '토끼', background: '숲', action: '춤' }, second: null },
        callEdgeFunction: async () => { throw new Error('busy'); },
        loadImageCount: async () => {}, console: { error() {} },
        openDifferenceNoteZone: () => { opened = true; },
    });
    const start = script.indexOf("compareGenerateBtn.addEventListener('click'");
    const end = script.indexOf('// 행동 data-value', start);
    vm.runInContext(script.slice(start, end), context);
    await handler();
    assert.equal(errors.length, 1);
    assert.equal(context.compareState.second, null);
    assert.equal(opened, false);
    assert.equal(context.compareGenerateBtn.disabled, false);
});
