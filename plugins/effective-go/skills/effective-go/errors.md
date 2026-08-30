# Errors — the full guide

Read this file on first use of the skill in a session, and again before
writing or reviewing any `error` value. `SKILL.md` carries the summary; this
file is the specification.

## The shape of an error message

An error message is read by a person, usually at the *end* of a chain of
wrapping. Every message is written so the concatenated chain reads as one
natural English sentence fragment. Two kinds of message exist, and they have
different grammar:

| Kind | Describes | Grammar | Example |
|---|---|---|---|
| **Operational** (wrapping a failure) | something you *tried to do* | `failed to <verb> <object>[ <detail>]: %w` | `failed to open config file %q: %w` |
| **Sentinel / state** | a *condition* that holds | noun phrase | `customer not found`, `wallet already exists` |
| **Validation** (bad input, nothing to wrap) | what is wrong with the input, with the offending value | noun phrase + `%q`/`%d` detail | `unknown tier %q`, `MAX_RETRIES must be non-negative, got %d` |

Rules for operational messages:

1. **Start with `failed to` or `unable to`, never a bare verb.**
   `"failed to fetch user %q: %w"` — not `"fetch user %q: %w"`, not
   `"fetching user: %w"`, not `"error fetching user: %w"`.
2. **Name the object.** The verb alone is useless: `"failed to decode"` says
   nothing; `"failed to decode webhook payload"` does.
3. **Include the identifying detail** the reader needs to find the failing
   thing — a path, a key, an ID, a bucket — with `%q` for strings.
4. **Wrapped error last**: `fmt.Errorf("...: %w", err)`. Never
   `fmt.Errorf("%w: ...", err)` and never `%v` when you mean `%w`.
5. **Lowercase first letter, no trailing punctuation.** Exception: the
   message may start with a proper noun, product name or acronym
   (`"AWS credentials are missing"`, `"TRM API key is required"`).
6. **Never `'%s'`** — use `%q`. It quotes correctly, escapes control
   characters, and makes an empty string visible.
7. **Not terse.** `"html: %w"`, `"s3: %w"`, `"db: %w"` are rejected on sight.

Validation errors are sentinel grammar with a detail: state the rule that
was broken and quote the value that broke it. No `failed to` (nothing was
attempted), no wrap (there is no underlying error). Export a sentinel and
wrap it (`fmt.Errorf("unknown tier %q: %w", tier, ErrUnknownTier)`) only
when a caller needs to branch on it.

Rules for sentinel and typed errors:

1. Describe the state as a noun phrase: `errors.New("customer not found")`.
2. Export them when a caller needs to make a decision on them:
   `var ErrNotFound = errors.New("customer not found")`.
3. Use a typed error (`type NotFoundError struct{ ID string }` with an
   `Error()` method) when the caller needs *data* from the error, not just
   its identity. Give it an `Error()` that reads like the sentinel.
4. Exported functions return the `error` interface, never a concrete error
   pointer type — a nil `*MyErr` stored in an `error` is non-nil.

## Constructing errors

- `errors.New` when there are no formatting directives.
  `fmt.Errorf("BUCKET is required")` is wrong; it is `errors.New("BUCKET is required")`.
- `fmt.Errorf` with `%w` to wrap. Wrap **once per layer**, adding what that
  layer knows (which file, which customer, which step). Do not re-wrap with
  the same words the callee already used.
- Never build a message from `err.Error()` with `%s`/`%v` — that severs the
  chain and breaks `errors.Is`/`errors.As` for every caller above you.
- Do not prefix every message with the package name (`"uploader: ..."`).
  The chain already carries the context; a prefix on every layer produces
  `"uploader: uploader: uploader: ..."`.

## Checking errors

- `errors.Is(err, ErrNotFound)` for sentinels, `errors.As(err, &target)`
  for typed errors. **Never** `err.Error() == "..."`, `strings.Contains(err.Error(), ...)`
  or `err == ErrX` on a possibly-wrapped error.
- Check every error at the call that produced it. An ignored error is written
  as `_ = f.Close()` **with a comment stating why it is safe to ignore**;
  a silent ignore is never acceptable.
- `Close` is the one idiomatic exception: `defer f.Close()` on a file or
  body opened **for reading** is correct as written — a close error after a
  successful read carries no information the caller can act on. A file
  opened **for writing** must have its `Close` error checked, because that
  is where a write can fail: `defer` a closure that records the error into
  a named result, or call `Close` explicitly before returning success.
- No in-band signaling: never return `-1`, `""`, or `nil` to mean "failed".
  Return `(T, error)` or `(T, bool)`.

## Handling errors — exactly once

Each error is handled **once**, by exactly one of:

| Action | When |
|---|---|
| Return it (wrapped) | Default. The caller decides. |
| Handle it here | You can retry, degrade, or substitute a default *and* the caller need not know. |
| Log it | You are at the top of the stack (`main`, an HTTP handler, a goroutine with no caller) and nobody else will see it. |
| `log.Fatal` / `os.Exit(1)` | `main` or `init`, startup misconfiguration only. |
| `panic` | A programmer error that cannot be recovered from — a violated invariant. Not for bad input, not for a failed request. |

**Log-and-return is double handling.** A function that does
`logger.Error("failed", "err", err); return fmt.Errorf(...: %w, err)` makes the
same failure appear twice in the logs once the caller logs it too. Pick one:
return it and let the top of the stack log, or log it and swallow it
(deliberately, with the reason). Library code returns; entrypoints log.

## Panics

- `panic` is for developers, `error` is for users. If a person operating the
  program could plausibly trigger it, it is an `error`.
- `Must*` helpers that panic are fine for package-level initialization with
  literal inputs (`regexp.MustCompile("^[a-z]+$")`), never with runtime input.
- `recover` only at goroutine or request boundaries, to convert a crash into
  an error/500 and a log line — never as a flow-control mechanism.

## The happy path stays left

```go
f, err := os.Open(path)
if err != nil {
    return fmt.Errorf("failed to open input file %q: %w", path, err)
}
defer f.Close()
// success continues here, unindented, with no else
```

Never put the success case inside an `else`, and never nest the next step
inside `if err == nil { ... }`.

## Worked example

```go
var ErrFileTooLarge = errors.New("file exceeds the maximum upload size")

func (c *Client) UploadFile(ctx context.Context, path, bucket string) error {
    f, err := os.Open(path)
    if err != nil {
        return fmt.Errorf("failed to open file %q for upload: %w", path, err)
    }
    defer f.Close() // read-only: a close error here is not actionable

    info, err := f.Stat()
    if err != nil {
        return fmt.Errorf("failed to stat file %q: %w", path, err)
    }
    if info.Size() > MaxFileSize {
        return fmt.Errorf("failed to upload %q (%d bytes, limit is %d): %w", path, info.Size(), MaxFileSize, ErrFileTooLarge)
    }

    if err := c.storage.Put(ctx, bucket, info.Name(), f); err != nil {
        return fmt.Errorf("failed to upload %q to bucket %q: %w", path, bucket, err)
    }
    return nil
}
```

Read top-down from `main`, the chain prints as:
`failed to process upload request: failed to upload "a.bin" to bucket "media": failed to write object "a.bin": connection reset by peer`
— every layer added something, and the reader can act on it.

## Review checklist for errors

- [ ] Operational messages start with `failed to` / `unable to` and name the object
- [ ] Sentinels are noun phrases; exported when a caller checks them
- [ ] `%w` is last; no `%v`/`%s` of an error inside a wrap
- [ ] `errors.New` when nothing is formatted
- [ ] `%q` for strings, never `'%s'`
- [ ] Lowercase start (proper nouns excepted), no trailing period
- [ ] No package-name prefixes, no terse one-word messages
- [ ] Comparisons use `errors.Is` / `errors.As`
- [ ] Every error handled exactly once — no log-and-return
- [ ] No `panic` reachable from user input; no ignored error without a comment (`defer f.Close()` on a reader excepted); every writer's `Close` error checked
