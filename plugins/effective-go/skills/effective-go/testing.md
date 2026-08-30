# Testing — the full guide

Read this file on first use of the skill in a session, and again before
writing any `_test.go` file or test double. `SKILL.md` carries the summary;
this file is the specification.

## Tests are cheap now — write more, not fewer

When an agent writes the tests, the historical cost argument for a thin
suite is gone. Err on the side of more coverage: every branch you can
reach, every error path, every edge case (empty, zero, nil, oversized,
malformed, duplicate, concurrent). Coverage is still not the goal —
confidence is — but the default answer to "should I add a case for
that?" is yes.

## Red → green, for new code and for refactors

For new behavior: write the test first, run it, watch it **fail** for the
reason you expect, write the least code that makes it pass, run it green,
then clean up. A test that has never failed proves nothing.

For a refactor, the same cycle inverted: **before** touching the code,
write (or find) a test that pins today's behavior and passes on the
original. Make the change. The same test, **unmodified or with only
mechanical edits** (a renamed identifier, an import), must still pass.
If it needs its expectations changed, the refactor changed behavior —
revert the refactor, not the test. A test that needs rewriting to survive
a refactor was testing the implementation, not the behavior; write it
against the public surface so it survives the next refactor too.

## User-journey tests

Unit tests prove functions; journey tests prove the product. A user
journey is one thing a real user does end to end, in order, through the
public surface — for a banking system: *create an account, send money to
it from another account, observe the balance land*. That is one journey
of many.

When you add or change a feature:

1. **Propose journeys to the user** — a short numbered list of the
   end-to-end paths a user would actually take through what you built,
   including the unhappy ones (insufficient funds, a duplicate transfer,
   a cancelled request). Ask which to add; do not write them all
   unasked, and do not skip proposing them.
2. Write each approved journey as one test that drives the system the way
   a user would — through the API, the CLI, or the top-level service —
   with real or in-memory dependencies, not mocks of the code under test.
3. Name it after the journey: `TestJourney_TransferLandsInRecipientBalance`.
4. Keep journeys in their own file with a build tag (`//go:build journey`
   or `e2e`) when they need infrastructure or take real time, so
   `go test ./...` stays fast and the journeys run on demand
   (`go test -tags journey ./...`).

## Where tests live

**Append to the existing `_test.go` file.** New tests for a package go at
the bottom of the test file that already covers that source file
(`foo.go` → `foo_test.go`); a diff that adds functions to the end of a
file is perfectly readable. Do **not** create a new test file for a single
function, a single scenario, a "cleaner" grouping, or because the existing
file is long. Create a new `_test.go` file only when:

- (a) **no test file exists** for the source file or package yet, or
- (b) the tests are a **different tier** that must be separated — unit vs
  smoke vs e2e/journey — because the separated tier needs a build tag, a
  different package (`foo_test` black-box), or infrastructure the unit
  tests must not depend on.

One source file, one test file, is the steady state. A package with
`foo_test.go`, `foo_edge_cases_test.go`, `foo_errors_test.go` and
`foo_more_test.go` is the failure mode.


- Same package as the code (`package uploader`), in `*_test.go`, named
  after the source file it covers. Use the
  black-box package `uploader_test` only when you want to prove the exported
  API is sufficient on its own or to break an import cycle.
- Fixtures in `testdata/` next to the test (the toolchain ignores that
  directory for builds).
- Integration tests that need real infrastructure go in a separate package or
  behind a build tag / environment check, so `go test ./...` stays fast and
  hermetic.
- Shared test scaffolding (fakes, fixture loaders, recorders) lives in one
  shared test-helper package that every suite imports. Never copy a helper
  from one `_test.go` into another.

## Shape of a test

- **Table-driven** whenever there is more than one case: a slice of
  `struct{ name string; ...; want T; wantErr error }`, iterated with
  `t.Run(tc.name, ...)`. Case names say what is being tested
  (`"rejects empty bucket"`), not `"case 3"`.
- **Arrange / Act / Assert**, visibly separated by a blank line. Arrange
  belongs in the table where possible.
- `Test<Func>` or `Test<Func>_<Scenario>` for names. Subtests carry the
  scenario when the table does.
- `t.Parallel()` on tests and subtests that share no mutable fixture. Note
  `t.Setenv` and `t.Parallel` are mutually exclusive.
- `t.Context()` for a context (Go 1.24+), never a bare
  `context.Background()` — it is cancelled when the (sub)test ends, so
  leaked goroutines die with the test. On a `go.mod` older than 1.24, the
  equivalent is `ctx, cancel := context.WithCancel(context.Background())`
  followed by `t.Cleanup(cancel)`.
- `t.TempDir()`, `t.Setenv()`, `t.Cleanup()` over hand-rolled setup/teardown.
- Helpers call `t.Helper()` first so failures point at the test, not the helper.
- No global mutable state shared between tests; no test order dependence.

## Assertions

- Failure messages are diagnosable without opening the implementation:
  what was called, with what, what came back, what was wanted —
  **got before want**:
  `t.Errorf("Parse(%q) = %v, want %v", in, got, want)`.
- `t.Errorf` by default so one run reports every failure; `t.Fatalf` only
  when continuing is meaningless (a precondition failed, `got` is nil and
  would be dereferenced).
- Errors are asserted with `errors.Is` / `errors.As` against a sentinel or
  type — never by comparing `err.Error()` to a string. Assert the *absence*
  of an error explicitly: `if err != nil { t.Fatalf("UploadFile(%q) returned unexpected error: %v", path, err) }`.
- Structural comparisons: `reflect.DeepEqual` is acceptable for plain
  data; if `github.com/google/go-cmp` is already a dependency, prefer
  `cmp.Diff`. Do not add an assertion library to a project that has none.
- Don't compare against text whose formatting is not guaranteed stable
  (raw JSON, `fmt`-formatted structs, map iteration order). Compare
  decoded values.

## Test doubles

**Hand-written, `Fn`-field mocks. No mocking library, no code generation.**

```go
type mockStorage struct {
    putFn func(ctx context.Context, bucket, key string, body io.Reader) error
    putCalls int
}

func (m *mockStorage) Put(ctx context.Context, bucket, key string, body io.Reader) error {
    m.putCalls++
    if m.putFn == nil {
        return errors.New("mockStorage.Put: putFn not implemented")
    }
    return m.putFn(ctx, bucket, key, body)
}
```

The rules that make this pattern work:

1. **One `Fn` field per interface method.** The test wires only what it needs.
2. **A nil `Fn` fails loudly.** A method with an `error` return returns a
   distinctive `not implemented` error naming the mock and the field. A
   method with **no** error return **panics** with the same text — it has
   no other way to fail. A test that forgets to wire a dependency its code
   actually calls must never pass on a zero value.
3. **Field naming:** unexported `<method>Fn` (`putFn`, `getByIDFn`) for
   mocks inside a `_test.go`; exported `Fn<Method>` (`FnPut`, `FnGetByID`)
   for mocks in a shared mocks package.
4. **Record calls when the code under test tolerates errors.** If the
   production path swallows the mock's error (log-and-continue), the
   `not implemented` error cannot fail the test — add a call counter or
   captured-arguments field and assert on it.
5. **Prefer a real thing over a mock when the stdlib provides one:**
   `httptest.NewServer` / `httptest.NewRecorder` for HTTP, `t.TempDir()`
   for the filesystem, an in-memory implementation for a store. Do not
   introduce `sqlmock`-style libraries; test SQL against a real database in
   integration tests or test the layer above it.
6. Interfaces exist so callers can inject; they are defined **by the
   consumer** and kept to the methods the consumer calls. Do not define an
   interface *only* to mock a type you own outright.
7. When an interface gains or loses a method, update **every**
   implementation and **every** mock — the real one, the shared mocks
   package, and each inline mock in `_test.go` files — in the same change.

## Coverage and running

- Coverage is a signal, not a goal — but tests are cheap to write now, so
  cover every reachable branch, edge case and error path; skip only
  trivial getters.
- Run `go test -race ./...` for anything that touches goroutines, channels
  or shared state; run `go vet ./...` always.
- A bug fix ships with a test that fails before the fix and passes after.

## Worked example

```go
func TestClient_UploadFile(t *testing.T) {
    t.Parallel()

    storageErr := errors.New("connection reset by peer")

    tests := []struct {
        name     string
        size     int64
        putFn    func(ctx context.Context, bucket, key string, body io.Reader) error
        wantErr  error
        wantPuts int
    }{
        {
            name:     "uploads a small file",
            size:     16,
            putFn:    func(context.Context, string, string, io.Reader) error { return nil },
            wantPuts: 1,
        },
        {
            name:    "rejects a file over the limit",
            size:    MaxFileSize + 1,
            wantErr: ErrFileTooLarge,
        },
        {
            name:     "wraps a storage failure",
            size:     16,
            putFn:    func(context.Context, string, string, io.Reader) error { return storageErr },
            wantErr:  storageErr,
            wantPuts: 1,
        },
    }

    for _, tc := range tests {
        t.Run(tc.name, func(t *testing.T) {
            t.Parallel()
            path := writeFileOfSize(t, tc.size)
            storage := &mockStorage{putFn: tc.putFn}
            client := NewClient(storage, slog.New(slog.NewTextHandler(io.Discard, nil)))

            err := client.UploadFile(t.Context(), path, "media")

            if !errors.Is(err, tc.wantErr) {
                t.Errorf("UploadFile(%q) error = %v, want %v", path, err, tc.wantErr)
            }
            if storage.putCalls != tc.wantPuts {
                t.Errorf("UploadFile(%q) called Put %d times, want %d", path, storage.putCalls, tc.wantPuts)
            }
        })
    }
}
```

`errors.Is(nil, nil)` is true, so the success case needs no special branch.
`slog.NewTextHandler(io.Discard, nil)` builds on any Go with `log/slog`;
from Go 1.24 on, `slog.New(slog.DiscardHandler)` is the shorter form.

## Review checklist for tests

- [ ] New behavior: a test was written first and seen to fail before the code made it pass
- [ ] Refactor: a pinning test passed on the original and still passes unmodified (or with mechanical edits only)
- [ ] Journeys proposed to the user for any feature change; approved ones written, tagged, and named after the journey
- [ ] New tests appended to the existing `_test.go`; a new file only because none existed or a separate tier needs one

- [ ] Table-driven with named cases; Arrange/Act/Assert visible
- [ ] `t.Context()`, `t.TempDir()`, `t.Setenv()`, `t.Cleanup()`, `t.Helper()` where applicable
- [ ] `t.Parallel()` where nothing shared is mutated
- [ ] Failure messages name the call, input, got, want — got first
- [ ] `t.Errorf` by default, `t.Fatalf` only for preconditions
- [ ] Errors checked with `errors.Is`/`errors.As`, never by string
- [ ] Mocks are hand-written `Fn`-field structs; nil `Fn` returns a `not implemented` error (or panics when there is no error return)
- [ ] Call counters where the code under test swallows errors
- [ ] `httptest` for HTTP, real/in-memory for storage, no mock libraries
- [ ] Every implementation and mock updated when an interface changed
- [ ] `go vet` and `go test -race` pass
