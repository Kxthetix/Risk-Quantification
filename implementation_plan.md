# CyberRisk Optimizer — implementation plan and built state

Smart India Hackathon 2026, Problem Statement 105. This document describes the application that
exists in this repository, the decisions that shaped it, and the work still outstanding. The original
pre-build plan is preserved unchanged at [docs/implementation_plan.prototype.md](docs/implementation_plan.prototype.md);
almost none of it survived contact with the problem, and the section "Where this departs from the
original plan" below says why.

## What the application does

A security team uploads a scanner export as JSON. The application reads it entirely in the browser,
prices every finding as an expected annual loss in rupees, ranks the findings, chooses a mitigation
portfolio against a stated budget, maps the resulting risk to five control frameworks, and exports a
board report as PDF and a control register as XLSX. There is no server, no API key and no network
call at runtime. The whole thing is a static bundle plus two JSON files it fetches from its own
origin.

That last constraint is load-bearing rather than decorative. A scan file names an organisation's
unpatched CVEs, its asset values and its security budget. Sending that anywhere is a worse risk than
most of what it describes.

## Current status, stated plainly

The scoring pipeline, the framework mapping, the optimiser, both exports and all five screens are
built and asserted. What is not built is the trained model: `data/raw/` holds only a fetch receipt
and `public/model/` does not exist, because the workspace this was assembled in has no network
egress. The application detects that no artefact is served and says so on every screen and in both
exported documents, rather than substituting a plausible-looking model. Nothing in this repository
has ever been scored by a model trained on real data, and no figure it produces should be quoted as
model performance.

Two further limits worth knowing before reading any claim of correctness. `vite build` cannot run
here — `node_modules` was installed on Windows, so only the `win32` rollup and esbuild binaries
exist — which means "the build passes" in this document always means `tsc --noEmit` passed and the
bundler half was not exercised. And `dist/` predates the current source: it carries
`dist/BUILD-IS-STALE.txt` and a banner in its own `index.html` saying so, and a harness check fails
if that ever stops being true while the bundle is out of date.

## How a scan becomes a rupee figure

Seven stages, in order, all inside `processScanData` in `src/utils/riskUtils.ts` or in modules it
calls.

**Ingest and validation** (`src/utils/scanValidation.ts`). Structural problems — findings absent, an
asset that is a string, a scan that is a bare array — are refused outright with every problem
reported at once, so a malformed file takes one upload to diagnose rather than eleven. Field-level
problems are repaired and recorded under a two-severity contract: an `error` means a stated figure
was unusable, so a reported total is now a *lower* bound; a `warning` means a descriptive field was
defaulted and no money moved. A repair never invents a quantity. An unusable asset value becomes
zero, because zero with a footnote understates visibly whereas a plausible substitute does not.
Validation lives inside `processScanData` rather than in the upload view, so the file picker, the
bundled-sample button and all four harnesses treat identical malformed input identically.

**Enrichment** is read from the scan file if present — the CVSS v3.1 vector, EPSS history, the NVD
reference profile — and the source and snapshot date travel with the figures into both exports.

**Scoring** takes one of three paths per finding, and which one it took is recorded on the finding as
`score_basis`. This is the single most important labelling decision in the codebase and it is
described in the next section.

**Aggregation** produces the organisation risk index: a log-scale loss ratio rounded to an integer,
spanning three decades. 0.01% of portfolio value is 0, 0.1% is 33, 1% is 67, 10% is 100. A doubling
of expected loss is therefore about +10 points. The denominator is the whole asset inventory, counted
once per asset — an asset carrying no findings still enlarges the portfolio, and five findings on one
server do not count that server five times.

**Optimisation** is a 0/1 knapsack over candidate controls at rupee granularity too coarse to matter,
maximising exposure avoided against the stated budget. Controls that state no usable cost are dropped
rather than budgeted at a guessed price.

**Framework mapping** classifies each finding into one of 18 vulnerability classes, then walks the
crosswalk to the controls that address that class in each of the five frameworks.

**Export** writes the PDF and the XLSX by hand — no dependency does either — and both carry the
provenance and completeness disclosures rather than only the numbers.

## The three scoring paths, and why they are named on screen

A single "risk score" column over rows computed three different ways is the failure this design
exists to prevent.

`model` means the trained gradient-boosted model predicted an exploitation probability from the CVSS
v3.1 sub-vectors, EPSS history, the NVD reference profile, the crosswalk vulnerability class, the
asset kind and the organisation profile. Expected annual loss is that probability times a modelled
loss band, capped at the asset's stated value.

`observed_kev` means the CVE is in the CISA KEV catalogue, so exploitation probability is 1 by
observation and only the loss figure is modelled. These findings are counted separately everywhere,
because folding them into "findings the model scored" would credit the model with predictions it was
never asked to make.

`heuristic` means no vector was available and the deterministic fallback ran: expected loss is the
risk index times the asset value times a likelihood factor built from EPSS and KEV membership. It
yields a score, not a calibrated probability, and the exports say so.

Every screen carries a non-dismissible provenance banner naming which paths produced the figures
below it, and an exposure-basis note splitting the headline total by path — because a board asked to
approve spending against ₹26.6 crore is entitled to know how much of that number is a model estimate.

## Framework mapping

Mapping is at control level, not at framework level, because "this finding relates to ISO 27001" is
not a finding a compliance officer can act on. `public/frameworks/crosswalk.json` is generated by
`frameworks/crosswalk.py` and carries 254 control mappings across five frameworks, each stamped with
how the identifier was established:

| Framework | Controls | Identifier status |
|---|---|---|
| ISO/IEC 27001:2022 Annex A | 54 | verified against the published standard |
| NIST CSF 2.0 subcategories | 64 | verified |
| CIS Controls v8.1 safeguards | 81 | verified |
| RBI Cyber Security Framework | 30 | inferred — substance correct, official clause numbering unconfirmed |
| SEBI CSCRF | 25 | assigned — identifier created by this project, basis recorded |

The distinction is surfaced in the UI and in both exports rather than buried in the file. An inferred
or assigned identifier is a mapping, not a citation, and a regulatory filing that treats it as one is
the specific harm this labelling prevents.

## The model: trained in Python, executed in the browser

`ml/train.py` fits a gradient-boosted tree ensemble and an isotonic calibrator in Python with numpy
only, then serialises the fitted trees to JSON. `src/model/gbm.ts` walks those trees in TypeScript at
inference time. The browser never trains and never fetches anything off-origin; the Python side never
runs in production. `ml/test_train.py` and `scripts/check-engine.cjs` assert that the two
implementations agree row for row within a stated tolerance, which is what makes the split safe.

Datasets are CISA KEV, EPSS historical daily scores, NVD CVE records and the VERIS Community
Database, fetched by `ml/fetch_real_data.py`. That script cannot reach them from this workspace.
Network egress here is a policy control and was not worked around; the two sanctioned routes are
widening the egress allowlist, or running `npm run data` on a machine with access and copying
`data/raw/` in. `npm run runbook` prints the handoff.

## Repository map

`src/model/` holds the scoring engine, CVSS v3.1 parsing, the feature builder, the GBM interpreter,
the crosswalk reader and the compliance mapper. `src/utils/` holds the pipeline entry point and the
ingest validator. `src/export/` holds hand-written ZIP, XLSX and PDF writers and the report
composition on top of them. `src/components/` and `src/pages/` are the UI: five tabs, an upload view,
and the provenance, completeness and exposure-basis banners that qualify every figure. `ml/` is the
Python training side. `frameworks/` generates the crosswalk. `scripts/` holds the four verification
harnesses. `src/data/mockData.ts` is 548 lines of invented figures left from the prototype, imported
by nothing, marked dead at the top, and asserted to stay unimported.

## Verification

`npm run check` runs `tsc --noEmit` and four harnesses that compile the real modules and assert
against their real output rather than against mocks:

| Harness | Checks | What it establishes |
|---|---|---|
| `check-compliance.cjs` | 59 | crosswalk integrity, control-level mapping, verification-status labelling |
| `check-engine.cjs` | 158 | CVSS parsing, feature construction, GBM traversal, Python/TypeScript parity |
| `check-exports.cjs` | 159 | ZIP structure, XLSX and PDF byte-level correctness, rupee formatting |
| `check-pipeline.cjs` | 192 | end-to-end scoring, the ingest gate, and that both deliverables disclose what the pipeline found |

`npm run check:ml` runs the five Python self-tests. `npm run check:all` runs both halves. Counts above
are the current state; see the README for the last full run.

Three things these harnesses deliberately assert that are easy to miss. The ingest gate is tested
against a scan carrying thirteen defects at once, and what is asserted is not just that it survives
but that no `₹NaN` reaches a formatter, no `Invalid Date` reaches the trend axis, and the total moves
*down*. The completeness disclosure is asserted in the exported bytes in both the clean and the dirty
state — a caveat that fires on every scan is noise, so the clean case asserts the caveat is absent.
And the portfolio-denominator behaviour is tested against a purpose-built fixture, because the
bundled sample scan is exactly one finding per asset and therefore cannot distinguish the correct
denominator from the bug.

## Where this departs from the original plan

The prototype plan proposed `computeRiskScore = (cvss/10) × epss × criticalityWeight` over a hand-
written `mockData.ts`, with expected loss as that score times asset value times a fixed 0.8. Three
things were wrong with it. The output was a unitless 0-1 number presented as if it were money; the
0.8 was an invented constant doing the work of a likelihood model; and there was no data, real or
otherwise, behind any of it. What replaced it is a calibrated exploitation probability against a
modelled loss band, with a deterministic formula as an explicitly-labelled fallback and every figure
carrying its provenance.

The plan also assumed shadcn/ui and react-router. Neither is present: the five views are tab state in
`App.tsx`, and the components are plain Tailwind. The runtime dependency list is `react`,
`react-dom`, `recharts`, `lucide-react`, `clsx` and `tailwind-merge` — the PDF, XLSX and ZIP writers,
the GBM interpreter and the CVSS parser are all hand-written, which is why the bundle has no
transitive dependency that could reach the network.

## What remains

Fetching the real datasets is blocked on egress and needs a decision from the operator; everything
downstream of it — building the feature dataset, training and calibrating, and exporting the artefact
to `public/model/` — is written and self-tested but cannot be run until the data is in place. A
rebuild of `dist/` is outstanding and must happen on a machine where `vite build` can execute.
