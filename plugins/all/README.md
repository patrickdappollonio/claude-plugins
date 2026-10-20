# all

Installs every plugin in this marketplace with one command, in Claude Code.

This plugin has no skills of its own. Its manifest lists every other plugin in the marketplace as a dependency, and Claude Code installs and enables each of them at the same scope.

```text
/plugin install all@patrickdappollonio
```

Or from your shell:

```bash
claude plugin install all@patrickdappollonio
```

## Good to know

- **New plugins come with updates.** When a plugin is added to this marketplace, it is also added to this bundle. Claude Code installs the new dependency when the marketplace auto-updates, on `/reload-plugins`, or when you run `claude plugin install all@patrickdappollonio` again.
- **Uninstalling the bundle keeps the plugins.** The plugins it installed stay until you run `claude plugin uninstall all --prune`, or `claude plugin prune` after uninstalling.
- **You cannot disable one plugin while the bundle is on.** Claude Code refuses to disable a plugin that an enabled plugin depends on. To leave some out, uninstall the bundle and install the plugins you want one by one.
- **Claude Code only.** Codex has no plugin dependencies, so there is no Codex version of this bundle. In Codex, install plugins one by one. In any other agent, `npx skills add patrickdappollonio/claude-plugins --all` installs every skill.
