# nixos-configuration

My NixOS configuration using flake and home-manager

## Autumn desktop

Shared Home Manager modules give all hosts small Hyprland client gaps (4 px
inner, 8 px outer), 10 px corners, a 2 px red-to-amber focus border, and soft
shadows on floating windows. Single-tiled-window workspaces stay gapless,
borderless, and square. Window and workspace motion uses roughly 200–250 ms
ease-out transitions; launcher/notification layers animate, while Epic Bar's
edge-flush panels remain stationary.

`Super+P` opens **Fuzzel**, replacing Tofi with a compact centered launcher,
Papirus app icons, fuzzy search, and the Autumn palette. Both desktop
applications and executables in `$PATH` are listed. Enter launches the selected
entry; Shift+Enter executes the typed command. Terminal applications use Kitty.
The launcher uses Iosevka Term Slab Medium and follows monitor scaling.

Dunst uses opaque warm-white notifications and distinct low/normal/critical
accents. Terminal text stays fully opaque at the compositor level; Kitty still
provides its own 80% background opacity.

These settings live in `modules/home-manager/{hyprland,fuzzel,stylix}.nix`.
Evaluate/build the target host before switching. Epic Bar is a separate
repository; this flake's `epic-bar-rs` input still uses its locked GitHub revision.
