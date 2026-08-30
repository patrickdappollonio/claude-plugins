# Style — the full reference

Read this file on first use of the skill in a session, and again when
naming, laying out a package, choosing receivers, writing an interface,
starting a goroutine, or writing a comment. `SKILL.md` carries the summary;
this file is the specification. It condenses *Effective Go*, the Google Go
Style Guide, the Gruntwork guide and the Go Proverbs, with the house rules
applied where they differ.

## Priorities

When rules conflict: **clarity → simplicity → concision → maintainability
→ consistency.** "Simplicity" means least mechanism: a language construct
before the standard library, the standard library before a dependency.
Consistency with the surrounding package matters, but consistency with
the wider Go ecosystem outranks a locally consistent mistake, and it never
justifies widening a deviation.

## Formatting

- `gofmt` (or `goimports`) output is final. Never hand-align, never argue.
- No line-length limit. If a line reads badly, extract a local or shorten
  a name; do not wrap a signature, an `if` header or a string literal.
- Opening brace on the same line as `if`/`for`/`switch`/`func` — always.
- Compare in natural order: `if n == 0`, never `if 0 == n`.
- Multi-line literals end every element with a trailing comma; omit the
  repeated element type inside slice/map literals (`[]*T{{A: 1}, {A: 2}}`).

## Naming

- `MixedCaps` / `mixedCaps`. Underscores only in `Test_`/`Benchmark_`
  function names and generated or OS-binding code.
- Initialisms keep one case throughout: `userID`, `ID`, `URL`, `parseURL`,
  `ServeHTTP`, `xmlAPI`, `XMLAPI`. Never `Id`, `Url`, `Http`.
- Length scales with scope and inversely with frequency of use: `i`, `r`,
  `w`, `ctx`, `err` in a few lines; `pendingUploads` at package level.
  Short in a small scope is right; cryptic in a large scope is wrong.
- No type in the name (`users`, not `userList`/`userSlice`/`numUsers`).
  No redundancy with the receiver (`func (u *User) Name()`, not `UserName`).
- Getters carry no `Get`: `Owner()`, `SetOwner()`. Use `Fetch`/`Compute`/
  `Load` when the call is expensive, so the cost is visible at the call site.
- One-method interfaces are named by the method plus `-er`: `Reader`,
  `Storer`, `Notifier`. Reuse the canonical names `Read`, `Write`, `Close`,
  `String` only with the canonical signatures and meaning; `String()`,
  never `ToString()`.
- Constants are `MixedCaps` named for role: `MaxPacketSize`, never
  `MAX_PACKET_SIZE` or `kMaxPacketSize`. Enumerations use `iota`.
- Receivers: one or two letters abbreviating the type (`c *Client`,
  `s *Server`), identical on every method of the type; never `this`,
  `self`, or the full type name.
- Packages: short, lowercase, one word, **singular** (`store`, not
  `stores`), no underscores, no `util`/`common`/`helpers`/`base`/`misc`,
  no stdlib collisions unless deliberate. Members do not repeat the
  package name: `widget.New`, `bufio.Reader`.
- Don't inflate a name to carry documentation; write the doc comment.
  `once.Do(setup)`, not `once.DoOrWaitUntilDone(setup)`.

## Package layout

- Organise by responsibility (`billing`, `auth`, `scraper`), never by kind
  (`models`, `handlers`, `utils`, `interfaces`).
- `cmd/<binary>/main.go` for each entrypoint; keep `main` thin — parse
  flags/env, build dependencies, call into a package, exit with a status.
- `internal/` for everything not meant to be imported from other modules —
  the default. A top-level package or `pkg/` only for code deliberately
  published for other modules to import.
- Start flat. Split when a package has two clear responsibilities, not
  before. Avoid deep nesting; for a multi-word concept nest (`billing/
  invoice`) rather than concatenate (`billinginvoice`) when depth is
  already justified.
- Layering, when the project has layers: transport (HTTP/gRPC handlers)
  parses requests, calls a service, formats responses — no business logic,
  no storage calls. The service layer owns orchestration and defines its
  own narrow interface for the storage it needs. Storage implements it.
- Imports in groups separated by blank lines: standard library; third
  party; the current module. Never `import .`. Rename an import only to
  break a collision or when the package name is uninformative. Blank
  imports only in `main` or tests, with a comment stating the side effect.
- One package comment, above `package x` with no blank line, in `doc.go`
  or the package's principal file.
- Flags are declared in `main` only. Libraries are configured through
  their API — constructor arguments, an options struct, or functional
  options.
- Configuration: read from environment variables (and optionally a file),
  give every option a sensible default, validate everything at startup and
  fail fast with an error that names the missing or invalid setting.

## Control flow

- Guard clauses and early returns. When an `if` body ends in `return`,
  `break`, `continue`, there is no `else`.
- Scope a value to its check with the initializer form:
  `if err := f.Chmod(0o644); err != nil { ... }`.
- `switch { case ...: }` replaces an `if`/`else if` chain; a type switch
  replaces a chain of type assertions. Group values in one `case` with
  commas; no redundant `break`; `fallthrough` only when explicitly wanted.
  A bare `break` inside a `switch` inside a `for` exits the switch — use a
  label to exit the loop.
- `for` is the only loop. `range` over strings yields runes, not bytes.
- `defer` a release next to its acquisition (`defer f.Close()`,
  `defer mu.Unlock()`); deferred arguments are evaluated at the `defer`
  line, calls run LIFO.
- Comma-ok everywhere it exists: `v, ok := m[k]`; `s, ok := x.(string)`.
  A bare type assertion panics on mismatch — only use it when the type is
  provably known.

## Functions and methods

- One job, named for it, short enough to read without scrolling. If a
  function needs a comment to explain *what* it does, split it.
- Parameters: `ctx context.Context` first; `error` last. More than three
  or four related parameters become an options struct; a constructor with
  several optional knobs takes functional options (`New(addr, WithTimeout(t))`)
  rather than positional booleans.
- Prefer pure functions: inputs as parameters, outputs as results. Return
  a new value rather than mutating through a pointer argument. Push I/O and
  side effects to a few isolated call sites.
- Named results only when they disambiguate (`(cancel func(), err error)`)
  or clarify two results of the same type; no naked `return` outside a
  tiny function.
- Multiple returns instead of out-parameters or in-band signals.
- Value vs pointer arguments: pass a large struct by pointer; pass small
  values, strings, slices, maps, interfaces by value. Don't take a pointer
  "to save bytes" for something you only read.

## Types and data

- **Make the zero value useful.** `var b Buffer` should work. When it can't,
  provide `New` returning `&T{...}` from a composite literal.
- Keyed fields in struct literals: always for another package's type,
  and for your own once it has more than two fields. Omit zero-valued
  fields.
- `make` for slices, maps, channels; `new` only for a zeroed pointer.
  Pre-size when the length is known: `make([]T, 0, n)`.
- Slices share their backing array; `append` may reallocate — always
  assign the result back. `len(s) == 0` for emptiness, never `s == nil`;
  return a nil slice, not `[]T{}`, when there is nothing to return.
- `strings.Builder` for concatenation in loops.
- Distinct type (`type Celsius float64`) by default; alias (`type A = B`)
  only for migration.
- `any`, never `interface{}`, and only when no concrete or narrow type
  will do. `reflect` is a last resort.
- Implement `String() string` to control formatting; convert the receiver
  to its underlying type inside it to avoid recursion.
- `fmt` verbs on purpose: `%v` default, `%+v` with field names, `%#v` Go
  syntax, `%T` type, `%q` quoted string, `%d` integers. Never `'%s'`.
- Embedding promotes methods; it is composition, not inheritance — the
  promoted method's receiver is the inner value. Initialise embedded
  pointers before use.

## Receivers

- Pointer receiver when the method mutates the receiver, the type contains
  a `sync.Mutex` or other non-copyable field, or the struct is large.
  **When in doubt, pointer.**
- Value receiver for small immutable value types, and for map/func/chan
  types that aren't reassigned.
- Never mix pointer and value receivers on one type.
- Pointer methods are only callable on addressable values, and interface
  satisfaction does not auto-address: if callers hold `T`, not `*T`, the
  interface methods must be value receivers.
- Never copy a value that contains a mutex, a `WaitGroup`, or a
  `bytes.Buffer` that has been used.

## Interfaces

- Defined by the **consumer**, in the package that calls the methods, with
  only the methods it calls — one to three is the norm. The implementer
  need not know the interface exists.
- Accept interfaces, return concrete types. Constructors return `*T`.
- No interface until a second implementation or a real seam (a test double
  for an external system) needs it. No interface whose sole purpose is to
  mock a type you fully own; no exported test doubles.
- Compile-time check next to the implementing type when satisfaction is
  load-bearing: `var _ Storage = (*S3)(nil)`.
- Embed interfaces to compose (`io.ReadWriter`); never embed a concrete
  type merely to satisfy an interface partially.
- Exported functions returning errors return the `error` interface, never a
  concrete `*MyError` — a nil pointer inside an interface is not nil.

## Generics

- Only when a current, concrete need exists — two call sites with
  different types today. Not because a function "happens not to care"
  about the type.
- Constrain as narrowly as the body allows; don't build type-level DSLs.
- Document exported generic APIs with an example instantiation.

## Concurrency

- **Every goroutine has an owner and a documented exit.** Nothing is
  launched without a way to stop it and a way to wait for it: a
  `sync.WaitGroup`, an `errgroup.Group`, a channel it ranges over that will
  be closed, or a `ctx.Done()` it selects on.
- Prefer a **synchronous** API. Finish your own goroutines before
  returning; let the caller add `go` if they want concurrency. Synchronous
  code is easier to test and cannot leak.
- Share memory by communicating: hand ownership of a value over a channel
  instead of two goroutines touching it under a lock.
- Channels orchestrate; mutexes serialize. A mutex guards a field or a
  map; a channel coordinates a pipeline, fan-out, or cancellation. Don't
  build channel machinery to protect a counter; don't use a mutex to
  sequence a workflow.
- Unbuffered channel = rendezvous (sync + data). Buffered channel when
  senders must not block until `n` items are queued. A buffered channel
  is also a counting semaphore for bounding concurrency; a fixed pool of
  workers ranging over a job channel beats a goroutine per item.
- `select` with `default` for non-blocking operations; `select` on
  `ctx.Done()` in every blocking wait.
- `runtime.GOMAXPROCS(0)` to read available parallelism; never hardcode a
  CPU count.
- Concurrency is structure; parallelism is execution. Add goroutines to
  model independent work, not because "it could run at once".
- Run `go test -race ./...` on any package with a goroutine, channel, or
  shared map.

## Context

- `ctx context.Context` is the first parameter, named `ctx`. Exceptions:
  HTTP handlers use `r.Context()`, tests use `t.Context()`, `main`/`init`
  use `context.Background()`.
- Forward the caller's `ctx`. Don't create a new one mid-stack unless you
  are deliberately detaching work (and say so in a comment).
- Never store a `Context` in a struct; never define a custom context type
  or a "context-like" interface.
- `context.WithTimeout` / `WithDeadline` around anything that can hang;
  always `defer cancel()`.
- `context.WithValue` only for request-scoped data crossing API boundaries
  (request ID, auth principal). Never for loggers, database handles, or
  any dependency — those are parameters or struct fields.

## Comments and documentation

- Every exported identifier — and any unexported one whose purpose isn't
  obvious — has a doc comment: a complete sentence beginning with the
  identifier's name and ending with a period.
  `// Client uploads local files to a Storage backend.`
- Package comment: `// Package uploader ...` directly above `package uploader`,
  in exactly one file.
- Doc comments are written for the **caller**: what it does, what it
  returns, what it panics on, whether it blocks, who owns the returned
  resource. Not how it is implemented.
- Inline comments explain *why* — a constraint, an invariant, a workaround
  with its exit condition, a non-obvious business rule. Never restate the
  next line (`// create a client` above `client := New()`), and never
  narrate history: no review rounds, iterations, ticket or task IDs, or
  "previously this did X". History lives in commit messages.
- A comment that explains *what* a function does is a signal to rename or
  split it.
- `//` for everything; `/* */` only for a long package comment.
- No ignored error without a comment saying why it is safe.

## Logging

- `log/slog`, structured: `logger.Error("failed to upload file", "path", path, "err", err)`.
  Keys are lowercase snake or single words, consistent across the program.
- Inject the logger (constructor argument or struct field); never pull it
  from a context or a global inside library code.
- Errors are logged at the top of the stack — `main`, a request handler,
  the root of a goroutine — not at every layer. A layer that returns an
  error does not also log it.
- A library may emit `Info`/`Debug` progress through a logger its caller
  injected for that purpose ("uploaded file", with the path and size).
  It never logs what it is about to return as an error, and it never
  logs on behalf of a caller that didn't hand it a logger.
- Don't `Fatal` from a library. `main` decides how to exit.
- Never format a message that has nothing to format (`Info("started")`,
  not `Infof("%s", "started")`).

## Dependencies and build

- Standard library first. A helper of a few dozen lines is copied, with
  attribution if licensed, not imported. Every dependency is audited and
  pinned in `go.mod`; `go mod tidy` runs with every dependency change.
- Use the Go version declared in `go.mod`. Never use a newer feature or
  bump the directive unless asked; leave the directive in whatever form
  the project or `go mod init` wrote it.
- OS-specific code and any cgo live behind `//go:build` constraints or
  `_linux.go`-style filenames. Avoid cgo when a pure-Go path exists.
- `unsafe` is avoided; if unavoidable, isolated in one file with a comment
  explaining the invariant it relies on.
- `math/rand` for anything security-relevant is a bug; use `crypto/rand`.
- `Must*` helpers (`regexp.MustCompile`, `template.Must`) only at package
  initialisation with literal inputs.
- Database work goes through the project's chosen query layer or code
  generator; raw SQL strings in application code are not written when
  such a layer exists. Pagination is cursor-based unless told otherwise.

## Working habits

- Change one file at a time in a reviewable order; do not touch unrelated
  code, and do not remove functionality that was not asked about.
- Derive values from data rather than hardcoding (a type from the
  configured chain, a path from the config), and validate permissively
  where an optional field is legitimately empty rather than forking a
  parallel code path.
- Refactor as you go only within the lines you are already changing; leave
  the rest for an explicit request.
- Verify before you assert. "It should work" is not a report; the output
  of `go vet`, `go test -race` and the linter is.
