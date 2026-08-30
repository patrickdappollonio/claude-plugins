# Testing — the full guide

Read this file on first use of the skill in a session, and again before
writing any `_test.go` file or test double. `SKILL.md` carries the summary;
this file is the specification.

## Where tests live

- Same package as the code (`package uploader`), in `*_test.go`. Use the
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
- `t.Context()` for a context, never `context.Background()` — it is
  cancelled when the (sub)test ends, so leaked goroutines die with the test.
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

- Coverage is a signal, not a goal. Cover the critical paths, the edge
  cases and the error branches; skip trivial getters.
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
            client := NewClient(storage, slog.New(slog.DiscardHandler))

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

## Review checklist for tests

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
