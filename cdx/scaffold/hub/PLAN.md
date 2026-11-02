# Future business-owned Shop Hub

Reserved source location for Apps Script. There is no deployed script or merchant
connection in this folder. No npm/clasp manifest is introduced before deciding
and testing the deployment/build route.

Planned boundaries: request authentication/pairing, permission enforcement,
immutable event acceptance and acknowledgement, single shared-view writer,
provider adapters/callback validation/status checks, scheduled file preparation,
and owner diagnostics. ZIMRA remains on the fiscal device; no private fiscal keys
or mutual TLS are delegated to Apps Script.

Suggested source groups once implemented: protocol, auth, journal, projections,
jobs, payments/providers, diagnostics and tests. Keep provider APIs behind a
contract; initialise one provider before adding a second.

Protocol preview:

```json
{
  "protocolVersion": 1,
  "businessId": "shop-demo-001",
  "deviceId": "P1",
  "requestId": "example-unique-request",
  "operation": "journal.accept",
  "batchId": "P1-000001",
  "eventCount": 1
}
```

Authentication material is omitted from this public preview. Define canonical
signing, replay protection, revocation, error codes, batch hash verification and
durable acknowledgement before implementation. Do not trust device names as
secrets. Journal acceptance and spreadsheet completion are separate outcomes.

Installation/update needs fresh-account prototype evidence, owner authorisation,
stable deployment references, version compatibility and rollback instructions.
Never deploy on a contributor's behalf merely because they run tests. Pin
versions per business; no unreviewed remotely mutable code silently executes
inside every shop account.

Tests use fake transports and deterministic fixtures. Provider sandbox checks
are separate; no production keys in CI. If a TypeScript/npm toolchain is selected,
add its manifest/lockfile, monthly grouped updates and generated-output checks
in the same reviewed change.
