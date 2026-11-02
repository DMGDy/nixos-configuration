# Herdr keybindings

Cheat sheet for the bindings set in [`herdr.nix`](./herdr.nix). Edit that
module (not Herdr's settings UI) to change them; `config.toml` is generated.

**Prefix:** `Ctrl+A` (Herdr's default is `Ctrl+B`). Press it, release, then
press the listed key. `Ctrl+A Ctrl+A` sends a literal `Ctrl+A` to the pane.

## Launching

| Keys | Action |
| --- | --- |
| `Mod+Ctrl+Return` | Open Herdr in its own Kitty window (`herdr-terminal`) |
| App launcher → **Herdr TUI** | Same, via the desktop entry |

`Mod` is `hyprland.modifier`: `Alt` by default, `Super` on framework_desktop.
The separate Kitty window keeps an outer tmux from swallowing the prefix.

## Panes

| Keys | Action |
| --- | --- |
| `Ctrl+H` / `Ctrl+J` / `Ctrl+K` / `Ctrl+L` | Focus pane left / down / up / right (no prefix) |
| `Prefix H` / `J` / `K` / `L` | Same, with the prefix |
| `Prefix Ctrl+H` / `Ctrl+J` / `Ctrl+K` / `Ctrl+L` | Resize pane left / down / up / right |
| `Prefix %` or `Prefix V` | Split side by side |
| `Prefix "` or `Prefix -` | Split stacked |
| `Prefix Z` | Toggle zoom |
| `Prefix [` | Copy mode (vi-style) |
| `Ctrl+S` or `Prefix A` | Jump to the last-focused pane, across tabs and workspaces |

`Ctrl+S` / `Prefix A` follow Herdr's pane history, so they don't match tmux's
separate last-session and last-window actions.

## Tabs

| Keys | Action |
| --- | --- |
| `Prefix C` | New tab |
| `Prefix N` / `Prefix P` | Next / previous tab |
| `Prefix 1`–`9` | Go to tab 1–9 |
| `Prefix ,` or `Prefix Shift+T` | Rename tab (new tabs are not prompted for a name) |
| `Prefix &` or `Prefix Shift+X` | Close tab |

## Workspaces and session

| Keys | Action |
| --- | --- |
| `Prefix S` or `Prefix W` | Workspace picker |
| `Prefix D` or `Prefix Q` | Detach (agents and shells keep running; run `herdr` to reattach) |
| `Prefix Shift+S` | Settings |

## Herdr defaults left unchanged

The module doesn't override these, so Herdr's defaults apply. They come from
the Herdr 0.9 config reference; check `Prefix ?` if a key does nothing.

| Keys | Action |
| --- | --- |
| `Prefix ?` | Keybinding help |
| `Prefix X` | Close pane |
| `Prefix Shift+H` / `J` / `K` / `L` | Swap pane left / down / up / right |
| `Prefix Tab` / `Prefix Shift+Tab` | Cycle to next / previous pane |
| `Prefix R` | Resize mode |
| `Prefix Shift+P` | Rename pane |
| `Prefix E` | Open pane scrollback in `$EDITOR` |
| `Prefix B` | Toggle sidebar |
| `Prefix G` | Session navigator |
| `Prefix O` | Focus the pane behind the visible notification |
| `Prefix Shift+N` | New workspace |
| `Prefix Shift+W` | Rename workspace |
| `Prefix Shift+D` | Close workspace |
| `Prefix Shift+G` | New Git worktree from the selected workspace |
| `Prefix Shift+R` | Reload `config.toml` |

## Other settings in the module

- Theme follows the terminal (Kitty's palette).
- New panes and tabs open in the focused pane's directory.
- The tab bar sits at the bottom, with hostname and zoom indicator on the right.
- Onboarding is turned off.

## Herdr GUI

[`herdr-gui-keys.json`](./herdr-gui-keys.json) becomes the GUI's `keys.json`.
It keeps the GUI's own defaults and adds the TUI bindings above, with the prefix
written as a `ctrl-a <key>` sequence. These TUI bindings have no GUI command
and aren't ported: pane resize (drag the divider), last pane (`Ctrl+S`,
`Prefix A`), detach, copy mode, cycle pane (`Prefix Tab`), scrollback in
`$EDITOR`, rename pane, the notification's pane, new worktree and reload config.
`Prefix G` opens the picker, like `Prefix S` and `Prefix W`.
