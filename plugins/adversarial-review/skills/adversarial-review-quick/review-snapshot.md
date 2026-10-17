# Review Snapshot — remembering what the last review saw

Every adversarial review, whatever its size, ends by recording a **snapshot**: a git commit object that holds the exact state of the work it reviewed — committed files, staged and unstaged edits, and new untracked files. The `adversarial-review-fast` skill compares the work now against that snapshot and reviews only what changed since. The other two skills only record it.

A snapshot is invisible. It is never on a branch, it never shows in `git log` or `git status`, it touches no file in the working tree, it leaves the user's staging area alone, and it never goes near the shared stash. Nothing points at it, so git cleans it up on its own, weeks later. Files matched by `.gitignore` are not in it.

## Take one

Run these from anywhere inside the repository. The first line finds a private index file inside the git directory — one per worktree — so the user's own index is never read or changed.

```bash
idx="$(git rev-parse --path-format=absolute --git-path adversarial-review.index)"
GIT_INDEX_FILE="$idx" git read-tree HEAD && GIT_INDEX_FILE="$idx" git add -A
GIT_INDEX_FILE="$idx" git write-tree
git -c user.name=adversarial-review -c user.email=adversarial-review@localhost commit-tree <tree-from-the-line-above> -p HEAD -m "adversarial-review: <full|quick|fast>"
```

The last command prints the snapshot ID. Rules:

- **Leave the private index file where it is.** The next snapshot overwrites it. Do not delete it: it lives in the git directory and harms nothing, and a removal of a computed path is the kind of command a harness safety check blocks.
- **A repository with no commits yet** has no `HEAD`: use `git read-tree --empty` in the second line and drop `-p HEAD` from the last one.
- **Reviewing a PR that is not checked out** has no local state to snapshot. Skip it and say so in one line.
- On Windows PowerShell, set `$env:GIT_INDEX_FILE` for the three commands that need it and clear it afterwards; the git commands are the same.

## Keep the ID

The snapshot is the state the review **looked at**, so take it in step 1, when the diff is captured — not after the fixes land. Fixes applied after the review are part of the next delta, which is the point: the next fast review checks them.

Once the report is out, record one line:

```
Last adversarial review: <snapshot-id> · <full|quick|fast> · branch <branch> · <date and time>
```

- **Always say it in the conversation**, as the last line of the report's close, so it stays in context.
- **When the harness gives you a scratchpad or session temp directory**, also write that line to `adversarial-review-last.txt` there, overwriting the old one, so it survives the conversation being summarized. Never write it inside the repository.
- When neither is available, the ID lives in context only. Losing it costs nothing but a larger next review.

## Use the ID (the fast skill)

1. Find the last line: in the conversation first, then in `adversarial-review-last.txt` in the scratchpad.
2. Ignore it — and review the whole change — when it names a different branch, or when `git cat-file -t <id>` does not print `commit`.
3. Otherwise take a new snapshot and diff the two:

```bash
git diff <old-id> <new-id>              # the delta under review
git diff --name-only <old-id> <new-id>  # the changed files
git diff --shortstat <old-id> <new-id>  # its size, for the sizing check
```

The delta is what changed since the last review of any size. When the user asks for the whole change instead, ignore the ID and capture the scope the usual way.
