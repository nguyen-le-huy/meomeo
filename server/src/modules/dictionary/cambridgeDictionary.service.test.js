import assert from "node:assert/strict";
import test from "node:test";
import { parseCambridgeHtml } from "./cambridgeDictionary.service.js";

const mainEntry = `
  <div class="pr dictionary">
    <div class="d pr di english-vietnamese kdic">
      <h2 class="di-title">urban</h2>
      <span class="pos">adjective</span>
      <span class="ipa">ˈəːbən</span>
      <div class="def-block">
        <div class="def">of or in a city</div>
        <div class="trans">thuộc, ở thành phố</div>
      </div>
    </div>
  </div>
`;

test("ignores IPA and audio from Cambridge sidebar content", () => {
  const html = `${mainEntry}
    <aside>
      <span class="ipa">/ˌhæp.i.ɡəʊˈlʌk.i/</span>
      <span class="us dpron-i"><source type="audio/mpeg" src="/media/happy-go-lucky.mp3"></span>
    </aside>`;

  const result = parseCambridgeHtml(html, "urban");

  assert.equal(result.phonetic, "/ˈəːbən/");
  assert.equal(result.audioUrl, "");
  assert.equal(result.vietnameseMeaning, "thuộc, ở thành phố");
});

test("uses audio only when it belongs to the matched dictionary entry", () => {
  const html = mainEntry.replace(
    '<span class="ipa">ˈəːbən</span>',
    '<span class="ipa">ˈəːbən</span><span class="uk dpron-i"><source type="audio/mpeg" src="/media/urban.mp3"></span>',
  );

  const result = parseCambridgeHtml(html, "urban");

  assert.equal(result.audioUrl, "https://dictionary.cambridge.org/media/urban.mp3");
});
