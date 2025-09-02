# Bi-Directional Contract Testing (Pact) – JavaScript-Node

A minimal, production-style project showing how to do **Bi-Directional Contract Testing (BDCT)** with Pact, Pactflow (API Hub for Contract Testing), and OpenAPI, locally and in GitHub Actions.  
Pacticipants (as they appear in Pactflow): **BDCT-JS-Consumer ↔ BDCT-JS-Provider**

---

## Contents

- [Overview](#overview)
- [Quick Command Reference](#quick-command-reference)
- [How to Use It (local & CI)](#how-to-use-it-local--ci)
  - [Configuration & Environment Variables](#configuration--environment-variables)
  - [Repository Layout](#repository-layout)
  - [Local “Good” Demo (Happy Path)](#local-good-demo-happy-path)
  - [Local “Bad” Demo (Intentional Failures)](#local-bad-demo-intentional-failures)
  - [Rich & MRDE Matchers](#rich--mrde-matchers)
  - [GitHub Actions CI Pipeline](#github-actions-ci-pipeline)
- [Bi-Directional Contract Testing Methodology](#bi-directional-contract-testing-methodology)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

---

## Overview

This project demonstrates **Bi-Directional Contract Testing (BDCT)** using Pact and OpenAPI:

- The **consumer** generates Pact contracts by running consumer tests (with Pact matchers).
- The **provider** publishes its OpenAPI specification (good vs. bad demo).
- The Broker compares the Pact contracts against the OpenAPI spec to determine compatibility.
- Results are published back to Pactflow and can gate releases via `can-i-deploy`.

Unlike Consumer-Driven Contract Testing (CDCT), BDCT does not require the provider to run a verifier against pact files. Instead, it leverages existing OpenAPI specs and compares them against consumer contracts automatically.

---

## Quick Command Reference

<details>
<summary><strong>Good (local):</strong></summary>

Run demo:bdct:good

</details>

<details>
<summary><strong>Bad (local):</strong></summary>

Run demo:bdct:bad

</details>

<details>
<summary><strong>Rich (local):</strong></summary>

Run demo:bdct:rich

</details>

<details>
<summary><strong>MRDE (local):</strong></summary>

Run demo:mrde

</details>

<details>
<summary><strong>CI (GitHub Actions):</strong></summary>

- Push to `main`
- Workflow runs:
  - generate & publish consumer pact
  - generate & publish provider spec
  - run can-i-deploy

</details>

---

## How to Use It (local & CI)

### Configuration & Environment Variables

| Name                      | Where                 | Purpose                                      |
|---------------------------|-----------------------|----------------------------------------------|
| `PACT_BROKER_BASE_URL`    | `.env` / GitHub Secret| Broker URL                                   |
| `PACT_BROKER_TOKEN`       | `.env` / GitHub Secret| Auth token                                   |
| `ENVIRONMENT`             | env                   | Target env for `can-i-deploy`                |
| `CONSUMER_VERSION`        | env / Git SHA         | Consumer version published to Broker         |
| `PROVIDER_VERSION`        | env / Git SHA         | Provider version published to Broker         |
| `DEMO_BAD`                | env (optional)        | If `true`, mutates OpenAPI spec for failures |

---

### Repository Layout
```
.
├─ .github/workflows/ci.yml # CI pipeline
├─ package.json # npm scripts
├─ .env # local-only secrets
├─ openapi/
│ └─ provider.generated.yaml # OpenAPI spec (good/bad)
├─ src/
│ ├─ consumer/
│ │ ├─ consumer.good.test.js # GOOD contract test
│ │ ├─ consumer.bad.test.js # BAD contract test
│ │ └─ consumer.rich.test.js # RICH + MRDE demo
│ └─ provider/
│ ├─ server.js # Example provider
│ └─ generate-spec.js # JSDoc → OpenAPI generator
└─ scripts/
├─ publish-consumer.cjs
├─ publish-provider.cjs
├─ record-deployment.cjs
├─ can-i-deploy.cjs
```
---

### Local “Good” Demo (Happy Path)

<details>
<summary><strong>Step-by-step (what to run locally)</strong></summary>

Generate the GOOD consumer contract:

npm run consumer:test:good

Publish it to the Broker:

npm run consumer:publish

Generate and publish the GOOD provider spec:
npm run provider:spec:good
npm run provider:publish

(Optional) Gate a deployment:
</details>

**What you’ll see:**

- The Broker shows a green verification line for **BDCT-JS-Provider** against **BDCT-JS-Consumer** (branch `main`).
- `can-i-deploy` returns **“Computer says yes”** when all required relationships are green.

---

### Local “Bad” Demo (Intentional Failures)

Use this to show mismatches (wrong types / missing fields), **Pending** behavior, and how the UI surfaces failures.

<details>
<summary><strong>Step-by-step (what to run locally)</strong></summary>

Generate & publish the mismatching consumer contract:

npm run consumer:test:bad

npm run consumer:publish:bad

Generate & publish the BAD provider spec:

npm run provider:spec:bad

npm run provider:publish

</details>

**What you’ll see:**

- In PactFlow, filter by **All branches/tags** to see both `main` (good) and `demo-bad` (bad).
- The `demo-bad` line will show failed verification(s).
- “Pending” semantics prevent breaking builds for new consumer branches until a successful verification exists.

---

### Rich & MRDE Matchers

Use these tests to demonstrate advanced matcher coverage:

- `consumer.rich.test.js` and `consumer.mrde.test.js` show:
  - Integers, decimals, booleans, timestamps, UUIDs
  - Regex constraints
  - `eachLike` for arrays
  - `like(null)` for nullable fields
  - MRDE style rules (non-empty strings, constrained enums, semver regexes)

This showcases the **expressiveness of Pact matchers** and how they map into BDCT comparisons.

---

### GitHub Actions CI Pipeline

On every push/PR to `main`, the workflow runs:

**consumer_publish**

npm ci

npm run consumer:test:good

npm run consumer:publish

**provider_publish** (depends on `consumer_publish`)

npm ci

npm run provider:spec:good

npm run provider:publish

**deploy_gate**
npm run can-i-deploy


**Secrets used:**

- `PACT_BROKER_BASE_URL`
- `PACT_BROKER_TOKEN`

---

## Bi-Directional Contract Testing Methodology

<details>
<summary><strong>Why BDCT?</strong></summary>

Bi-Directional Contract Testing (BDCT) leverages both consumer-generated contracts and provider-defined OpenAPI specs:

- **Shift left on integration bugs**  
  Catch mismatches early by comparing consumer expectations to provider documentation.

- **High signal, low cost feedback**  
  No need for providers to re-run verifiers against every pact file. Compatibility is computed automatically.

- **Independent deployments**  
  With results stored in the Broker, the `can-i-deploy` tool can tell you whether a given provider build is safe to release into an environment.

- **Confidence across branches and environments**  
  By publishing contracts and specs with branch/version metadata, the Broker creates a compatibility matrix across consumers and providers.
</details>

<details>
<summary><strong>How BDCT works here</strong></summary>

1. **Consumer test (pact generation)**  
   - The consumer runs Pact tests (in `src/consumer/consumer.good.test.js`, etc).
   - Pact spins up a mock HTTP server and records expected requests/responses.
   - Pact produces a Pact file describing these expectations.

2. **Publishing the pact**  
   - The consumer pact is published to the Broker with metadata: consumer name, branch, version, tags.

3. **Provider spec generation & publishing**  
   - The provider generates its OpenAPI spec from JSDoc (`src/provider/generate-spec.js`).
   - This spec is published to the Broker with metadata: provider name, branch, version.

4. **Compatibility check**  
   - The Broker automatically compares consumer pacts against the provider’s OpenAPI.
   - Mismatches (wrong types, missing fields) show up immediately in the UI.

5. **Release gating (`can-i-deploy`)**  
   - CI/CD asks the Broker: *“Can this version go to environment X?”*
   - If all required relationships are compatible, ✅ “Computer says yes.”
   - Otherwise, ❌ deploy is blocked until compatibility is restored.
</details>

---

## Troubleshooting

<details>
<summary><strong>“No paths match” errors in pactflow-ai or BDCT generate</strong></summary>

**Why:** The `--endpoint` flag you passed doesn’t exist in your OpenAPI spec.  
Example: you run with `--endpoint /menu`, but your spec only has `/users/{id}`.

**Fix:**  
- Check the `paths:` section of your OpenAPI file.  
- Pass the exact string (`/users/{id}`) to `--endpoint`.  
- In PowerShell, don’t wrap the path in single quotes (`'/users/{id}'` → wrong). Use either no quotes or double quotes.
</details>

<details>
<summary><strong>“Cannot change the content of the pact …” when publishing</strong></summary>

**Why:** Pact Broker prevents overwriting a pact with the same consumer version but different contents.  

**Fix:**  
Publish with a new, unique version:  

PowerShell

$env:CONSUMER_VERSION = "$(git rev-parse --short HEAD)-bad"

npm run consumer:publish:bad

</details>

<details>
<summary><strong>Verification shows all red even on “good” demo</strong></summary>

**Why:** Your provider spec and consumer pact are out of sync.  
Common causes:  
- Generated OpenAPI spec is stale (wasn’t re-run after code changes).  
- Wrong environment variable (`DEMO_BAD=true` still set).  
- Branch/version mismatch (consumer published on `main`, provider published on `demo-bad`).

**Fix:**  
- Re-run the spec generator before publishing: `npm run provider:spec:good`.  
- Ensure `DEMO_BAD` is unset.  
- Double-check branch/tag logs in publish steps.
</details>

<details>
<summary><strong>“Computer says no” from can-i-deploy</strong></summary>

**Why:** One or more required relationships failed compatibility checks.  
- Consumer requires fields not in provider spec.  
- Provider spec has breaking changes (removed/mutated fields).  
- Missing verification (consumer published, provider spec not published).

**Fix:**  
- Inspect Pactflow UI → Relationship view → Diff/mismatch view.  
- Fix mismatches in code/spec.  
- Re-run publish + can-i-deploy.
</details>

<details>
<summary><strong>Consumer tests pass locally, but Broker shows incompatibility</strong></summary>

**Why:** Locally, your Pact mock will always satisfy the contract. In BDCT, the **real provider spec** is compared, so mismatches surface.  

**Fix:**  
- This is expected behavior. Demo it as “mock passes, but Broker fails — BDCT saved us.”  
- Align provider spec types and required fields with consumer contract.
</details>

<details>
<summary><strong>Provider spec not appearing in Broker</strong></summary>

**Why:**  
- `PACT_BROKER_BASE_URL` or `PACT_BROKER_TOKEN` not set.  
- `PROVIDER_CONTRACT` file missing or path wrong.  
- Publish script failed silently.

**Fix:**  
- Check logs printed by `scripts/publish-provider.cjs`.  
- Ensure the OpenAPI file exists at `openapi/provider.generated.yaml`.  
- Rerun with debug logging:  
</details>

<details>
<summary><strong>Verification shows all red even on “good” demo</strong></summary>

**Why:** Your provider spec and consumer pact are out of sync.  
Common causes:  
- Generated OpenAPI spec is stale (wasn’t re-run after code changes).  
- Wrong environment variable (`DEMO_BAD=true` still set).  
- Branch/version mismatch (consumer published on `main`, provider published on `demo-bad`).

**Fix:**  
- Re-run the spec generator before publishing: `npm run provider:spec:good`.  
- Ensure `DEMO_BAD` is unset.  
- Double-check branch/tag logs in publish steps.
</details>

<details>
<summary><strong>“Computer says no” from can-i-deploy</strong></summary>

**Why:** One or more required relationships failed compatibility checks.  
- Consumer requires fields not in provider spec.  
- Provider spec has breaking changes (removed/mutated fields).  
- Missing verification (consumer published, provider spec not published).

**Fix:**  
- Inspect Pactflow UI → Relationship view → Diff/mismatch view.  
- Fix mismatches in code/spec.  
- Re-run publish + can-i-deploy.

</details>

<details>
<summary><strong>Consumer tests pass locally, but Broker shows incompatibility</strong></summary>

**Why:** Locally, your Pact mock will always satisfy the contract. In BDCT, the **real provider spec** is compared, so mismatches surface.  

**Fix:**  
- This is expected behavior. Demo it as “mock passes, but Broker fails — BDCT saved us.”  
- Align provider spec types and required fields with consumer contract.
</details>

<details>
<summary><strong>Provider spec not appearing in Broker</strong></summary>

**Why:**  
- `PACT_BROKER_BASE_URL` or `PACT_BROKER_TOKEN` not set.  
- `PROVIDER_CONTRACT` file missing or path wrong.  
- Publish script failed silently.

**Fix:**  
- Check logs printed by `scripts/publish-provider.cjs`.  
- Ensure the OpenAPI file exists at `openapi/provider.generated.yaml`.  
- Rerun with debug logging:  

DEBUG=pact* npm run provider:publish

</details>

<details>
<summary><strong>Consumer publish works, but UI shows no new version</strong></summary>

**Why:** Version collision. You published with the same `CONSUMER_VERSION` as a prior run.  

**Fix:**  
- Use Git SHA, timestamp, or suffix for uniqueness.  
- In CI, tie version to commit SHA.  
- Locally, append a suffix:  

$env:CONSUMER_VERSION_SUFFIX="demo"

npm run consumer:publish

</details>

<details>
<summary><strong>Windows: inline env vars not working</strong></summary>

**Why:** PowerShell does not support `FOO=bar` syntax.  

**Fix:** Use PowerShell syntax instead:  

$env:FOO = "bar"

npm run some:script

or rely on provided npm scripts (they’re cross-platform).
</details>

<details>
<summary><strong>“Provider spec mutated to string” unexpectedly</strong></summary>

**Why:** You ran the generator with `DEMO_BAD=true`, which intentionally mutates the `active` field type.  

**Fix:**  
Unset the env var and regenerate:  

$env:DEMO_BAD = ""

npm run provider:spec:good

</details>

<details>
<summary><strong>Slow or hanging verification</strong></summary>

**Why:**  
- Corporate proxies intercepting Broker calls.  
- TLS inspection breaking HTTPS requests.  
- OpenAPI spec very large with many schemas.  

**Fix:**  
- Unset proxy vars:  

Remove-Item Env:\HTTP_PROXY, Env:\HTTPS_PROXY -ErrorAction SilentlyContinue

$env:NO_PROXY="127.0.0.1,localhost"

- For TLS issues:  

$env:PACT_BROKER_DISABLE_SSL_VERIFICATION="true"

(Only for demos, not production.)
</details>

<details>
<summary><strong>Broker shows “work in progress (WIP)” pacts</strong></summary>

**Why:** You’re using `--include-wip-pacts-since` in verifier or Broker configuration. This shows new pacts early for feedback.  

**Fix:** It’s expected. WIP pacts don’t block builds unless configured to.  
</details>

<details>
<summary><strong>Provider not found in can-i-deploy</strong></summary>

**Why:**  
- Provider spec was never published.  
- Names don’t match (`BDCT-JS-Provider` vs `bdct-js-provider`).  
- Wrong branch filter in UI.  

**Fix:**  
- Re-publish with correct provider name (case-sensitive).  
- Confirm both consumer and provider names in Broker match your test definitions.
</details>

<details>
<summary><strong>npm ci fails with “ancient lockfile”</strong></summary>

**Why:** `package.json` and `package-lock.json` out of sync.  

**Fix:**  

rm -rf node_modules

npm install

git add package-lock.json

git commit -m "chore: refresh lockfile"

git push

</details>

<details>
<summary><strong>“Cannot find module dotenv” or other deps missing</strong></summary>

**Why:** Dependency not installed or missing from lockfile.  

**Fix:**  

npm install dotenv --save

git add package.json package-lock.json

git commit -m "chore: add dotenv"

git push

</details>

<details>
<summary><strong>How do I reset the demo back to good state?</strong></summary>

**Fix:**  
Run the good flows:  

npm run consumer:test:good

npm run consumer:publish

npm run provider:spec:good

npm run provider:publish


Switch Pactflow filters back to `main`. The “bad” branch history remains for demo purposes but won’t affect `main`.
</details>


---

## FAQ

<details>
<summary><strong>How is BDCT different from CDCT?</strong></summary>
CDCT = consumer defines → provider verifies.  
BDCT = consumer defines & provider defines → broker auto-compares.  

CDCT requires providers to run verifiers against pact files.  
BDCT leverages existing OpenAPI/AsyncAPI specs, saving providers from extra work.
</details>

<details>
<summary><strong>Do I still need Pact tests?</strong></summary>
Yes — consumers still run Pact tests to describe what they actually rely on.  
Providers only need to publish their specification (OpenAPI/AsyncAPI).  

Without consumer tests, you only know “what’s possible” (OpenAPI).  
With Pact, you also know “what’s relied upon” (contracts).
</details>

<details>
<summary><strong>What if the provider has no OpenAPI spec?</strong></summary>
BDCT requires a machine-readable provider contract (OpenAPI, AsyncAPI, or Protobuf).  
If no spec exists:
- Generate one from code annotations (Swagger-jsdoc, SpringDoc, etc).  
- Or fallback to CDCT, where providers run pact verification tests directly.  
</details>

<details>
<summary><strong>Can I run both CDCT and BDCT?</strong></summary>
Yes. Many teams run CDCT on legacy services while introducing BDCT for newer APIs that already publish OpenAPI specs.  
Pactflow supports mixing both approaches in the same Broker instance.  
</details>

<details>
<summary><strong>What tools generate OpenAPI specs automatically?</strong></summary>
- **JavaScript/Node** → swagger-jsdoc, tsoa  
- **Java/Spring** → SpringDoc OpenAPI  
- **.NET** → Swashbuckle  
- **Python** → FastAPI (built-in)  
If your framework can’t generate one, you can hand-craft YAML/JSON or layer tooling on top.
</details>

<details>
<summary><strong>What happens if consumer and provider disagree?</strong></summary>
The Broker shows a red ❌ verification line between consumer and provider.  
`can-i-deploy` will block deployments into the target environment.  
Mismatch examples:
- Consumer expects `active: string`, provider spec says `active: boolean`.  
- Consumer requires `role` field, provider spec does not list it.  
</details>

<details>
<summary><strong>Why do I see “Pending” in the UI?</strong></summary>
A pact is pending until a provider spec has been successfully matched against it at least once.  
Pending prevents consumer experiments on feature branches from breaking provider builds.  
Once verified, failures are treated as blocking.  
</details>

<details>
<summary><strong>How are branches and versions used?</strong></summary>
- **Branch** → groups contracts/specs (e.g., `main`, `demo-bad`, `feature/x`).  
- **Version** → immutable ID, usually a Git SHA.  
The Broker uses this metadata to create a compatibility matrix across all participants and environments.
</details>

<details>
<summary><strong>What does <code>can-i-deploy</code> actually check?</strong></summary>
It asks: *“Given all known consumer ↔ provider relationships, has this version been successfully verified against every required counterpart in the target environment?”*  
If yes → ✅ “Computer says yes.”  
If no → ❌ exit code 1, deployment blocked.  
</details>

<details>
<summary><strong>Can I test multiple consumers and providers?</strong></summary>
Yes. Each consumer publishes its contracts. Each provider publishes its OpenAPI specs.  
The Broker automatically composes a compatibility matrix across them all.  
This is where BDCT scales better than CDCT — providers don’t rerun verifiers N times.
</details>

<details>
<summary><strong>What about GraphQL, gRPC, or async APIs?</strong></summary>
- **GraphQL** → Publish SDL schemas as provider contracts, consumers generate pact files.  
- **gRPC/Protobuf** → Pact supports Protobuf as contract format.  
- **Async APIs (Kafka, SNS, AMQP)** → Pact supports AsyncAPI-based BDCT.  
</details>

<details>
<summary><strong>How do optional fields and arrays work?</strong></summary>
- If the consumer doesn’t need a field, don’t include it in the contract.  
- Arrays are strict by default (order matters) unless you use array matchers (`eachLike`).  
- Nullable values are supported via `like(null)`.  
</details>

<details>
<summary><strong>How do I simulate breaking changes for a demo?</strong></summary>
- Run `npm run consumer:test:bad && npm run consumer:publish:bad` to create a bad pact.  
- Run `npm run provider:spec:bad && npm run provider:publish` to publish a mismatching spec.  
Check the UI (`demo-bad` branch) to see failures visualized.  
</details>

<details>
<summary><strong>What if I get “Cannot change the content of the pact …” when publishing?</strong></summary>
The Broker rejects overwriting the same consumer version with different content.  
Fix: publish with a unique version.  


