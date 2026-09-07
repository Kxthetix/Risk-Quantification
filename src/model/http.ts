/**
 * The one piece of transport knowledge that two loaders need, kept in a file neither of them owns.
 *
 * Why it exists: every static host that serves a single-page app has a catch-all rewrite. Any path
 * it cannot resolve to a file is answered with `index.html`, at HTTP 200 — `vite dev` does it,
 * `vite preview` does it, and so do GitHub Pages, Netlify, Vercel and an S3 website endpoint. So a
 * fetch for an asset that was never deployed does not 404. It succeeds, and returns the app's own
 * HTML shell.
 *
 * That is not a hypothetical. It was observed in the running app: with `public/model/` absent — this
 * project's normal state until the training data lands — the provenance banner read
 *
 *     Model file found but rejected — /model/risk-model.json is served but is not valid JSON
 *     (Unexpected token '<', "<!DOCTYPE "…)
 *
 * Both halves of that headline are false. No model file was found, and nothing was rejected on its
 * merits. It sends an operator to debug a corrupt artefact that does not exist, and it is precisely
 * the failure mode the banner was built to prevent, so the sniff belongs below the banner rather
 * than in it.
 *
 * The rule this encodes: a markup body on a JSON fetch means "not served", not "corrupt".
 */

/** A byte-order mark is a byte-order mark, not content — and `JSON.parse` throws on one. */
export function stripBom(body: string): string {
  return body.charCodeAt(0) === 0xfeff ? body.slice(1) : body;
}

/**
 * Whether a response body is markup rather than the JSON that was asked for.
 *
 * The test is deliberately blunt: a JSON document cannot begin with `<`, so any body that does is
 * one `JSON.parse` was never going to accept, and the only remaining question is which conclusion to
 * report. Sniffing for `<!doctype`/`<html` specifically was the first attempt and it is worse —
 * shells that open with a comment, a wrapper element or an XML declaration all slip past, and each
 * miss costs the false "model file found but rejected" headline this file exists to prevent. It also
 * catches the XML error document some object stores return, whose conclusion is the same: not served.
 *
 * The body decides, never the `Content-Type` header. A host that mislabels a perfectly good artefact
 * must not cost us a model that parses, and a host that serves its shell as `application/json` must
 * not be believed. The header is worth quoting in a message as corroboration and worth nothing as a
 * test — both directions are asserted in `scripts/check-engine.cjs`.
 */
export function looksLikeMarkupNotJson(body: string): boolean {
  return stripBom(body).trimStart().startsWith('<');
}

/**
 * The message for that case. Written to be read by whoever has to fix it: it states what came back,
 * why a 200 does not mean the file is there, and which conclusion to draw.
 */
export function markupInsteadOfJsonDetail(url: string, contentType?: string | null): string {
  return (
    `${url} returned markup, not JSON` +
    (contentType ? ` (Content-Type: ${contentType})` : '') +
    ' — a single-page-app host answers a path it cannot resolve with index.html at HTTP 200, so ' +
    'this is the file being absent rather than corrupt'
  );
}
