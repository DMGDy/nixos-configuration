{ config, lib, pkgs, ... }:

# The Herdr desktop app (herdr-app, from the Herdr installer). Its config folder
# is live: the app and agents edit layouts and mods in place, and the app writes
# settings.json and layouts/.state (clicks) itself. So this module doesn't link
# read-only store files for those. It copies `source` (layouts/, mods/, themes/)
# into ~/.config/herdr-app as normal files on switch, merges `settings` into
# settings.json, and links `keys` (read-only, as before).
#
# A switch only copies when `source` changed since the last copy, and then only
# files whose content differs; any live file it replaces is kept first under
# ~/.config/herdr-app-saves/pre-switch-<time>/. Files that aren't in `source`
# (the app's shipped mods, generated *.d.ts, data/) are left alone.
#
# Changed something live? `herdr-app-save` copies your own layouts, mods and
# themes (everything the app didn't ship) back into `checkout`, ready to commit.

let
  cfg = config.programs.herdr-app;
  live = "${config.xdg.configHome}/herdr-app";
  rsync = "${pkgs.rsync}/bin/rsync";
  jq = "${pkgs.jq}/bin/jq";

  # source plus extraFiles, as one tree to copy.
  tree =
    if cfg.extraFiles == { } then cfg.source
    else pkgs.runCommand "herdr-app-files" { } (''
      ${lib.optionalString (cfg.source != null) "cp -r --no-preserve=mode ${cfg.source} $out"}
      mkdir -p $out
    '' + lib.concatStrings (lib.mapAttrsToList (rel: file: ''
      mkdir -p "$out/$(dirname ${lib.escapeShellArg rel})"
      cp -r --no-preserve=mode ${file} $out/${lib.escapeShellArg rel}
    '') cfg.extraFiles));

  settingsFile = pkgs.writeText "herdr-app-settings.json" (builtins.toJSON cfg.settings);

  save = pkgs.writeShellScriptBin "herdr-app-save" ''
    # Copies your own herdr-app layouts, mods and themes into the Nix checkout.
    # "Your own" = not listed in installed.json (what the app ships). Editor
    # files the app generates (*.d.ts, jsconfig.json) are skipped.
    set -euo pipefail
    live=''${HERDR_APP_HOME:-${live}}
    repo=${lib.escapeShellArg cfg.checkout}
    [ -f "$live/installed.json" ] || { echo "no $live/installed.json: has herdr-app run here?" >&2; exit 1; }
    mkdir -p "$repo/layouts" "$repo/mods" "$repo/themes"
    # extraFiles are built by Nix (e.g. downloaded art), so never saved back.
    skip=$(mktemp); trap 'rm -f "$skip"' EXIT
    printf '%s\n' ${lib.escapeShellArgs (lib.attrNames cfg.extraFiles)} > "$skip"
    shipped=$(${jq} -r 'keys[]' "$live/installed.json")
    is_shipped() { grep -qxF "$1" <<<"$shipped"; }

    for d in "$live"/mods/*/; do
      m=$(basename "$d")
      is_shipped "$m" && continue
      sed -n "s|^mods/$m/|/|p" "$skip" > "$skip.mod"
      ${rsync} -a --delete --exclude '*.d.ts' --exclude jsconfig.json --exclude-from="$skip.mod" "$d" "$repo/mods/$m/"
      rm -f "$skip.mod"
      echo "mod     $m"
    done
    for f in "$live"/layouts/*.json; do
      l=$(basename "$f" .json)
      is_shipped "layout:$l" && continue
      cp "$f" "$repo/layouts/$l.json"
      echo "layout  $l"
    done
    for f in "$live"/themes/*.json; do
      [ -L "$f" ] && continue
      cp "$f" "$repo/themes/"
      echo "theme   $(basename "$f" .json)"
    done

    # Gone from the app but still in the checkout: say so, don't delete.
    for d in "$repo"/mods/*/; do [ -d "$live/mods/$(basename "$d")" ] || echo "only in checkout: mods/$(basename "$d")"; done
    for f in "$repo"/layouts/*.json; do [ -f "$live/layouts/$(basename "$f")" ] || echo "only in checkout: layouts/$(basename "$f")"; done
    echo "saved to $repo (review with git diff, then commit and switch)"
  '';
in
{
  options.programs.herdr-app = {
    enable = lib.mkEnableOption "the Herdr desktop app's layouts, mods, themes and settings";

    source = lib.mkOption {
      type = lib.types.nullOr lib.types.path;
      default = null;
      description = "Folder with layouts/, mods/ and themes/, copied (not linked) into ~/.config/herdr-app on switch.";
    };

    checkout = lib.mkOption {
      type = lib.types.str;
      default = "${config.home.homeDirectory}/nixos/modules/home-manager/herdr-app/files";
      description = "Where `herdr-app-save` writes: the working-tree copy of `source`.";
    };

    settings = lib.mkOption {
      type = lib.types.attrsOf lib.types.anything;
      default = { };
      description = "Merged over settings.json on switch; keys not set here (zoom, ...) stay the app's.";
    };

    extraFiles = lib.mkOption {
      type = lib.types.attrsOf lib.types.path;
      default = { };
      example = lib.literalExpression ''{ "mods/my-mod/logo.png" = pkgs.fetchurl { ... }; }'';
      description = "Files (or folders) built by Nix, added to `source` at these paths (relative to ~/.config/herdr-app); `herdr-app-save` skips them.";
    };

    keys = lib.mkOption {
      type = lib.types.nullOr lib.types.path;
      default = null;
      description = "keys.json, linked read-only.";
    };
  };

  config = lib.mkIf cfg.enable {
    home.packages = [ save ];

    xdg.configFile."herdr-app/keys.json" = lib.mkIf (cfg.keys != null) {
      source = cfg.keys;
      force = true;
    };

    home.activation.herdrApp = lib.hm.dag.entryAfter [ "linkGeneration" ] ''
      live=${lib.escapeShellArg live}
      stamp=${lib.escapeShellArg "${config.xdg.stateHome}/herdr-app/deployed"}
      run mkdir -p "$live" "$(dirname "$stamp")"
      ${lib.optionalString (tree != null) ''
        src=${tree}
        if [ "$(cat "$stamp" 2>/dev/null)" != "$src" ]; then
          backup="${config.xdg.configHome}/herdr-app-saves/pre-switch-$(date +%Y%m%d-%H%M%S)"
          # -c: compare content (store files all have mtime 1); replaced files go to $backup.
          run ${rsync} -rlc --chmod=Du=rwx,Dgo=rx,Fu=rw,Fgo=r --backup --backup-dir="$backup" "$src/" "$live/"
          if [ -d "$backup" ]; then echo "herdr-app: replaced live files kept in $backup"; fi
          run --quiet sh -c 'echo "$1" > "$2"' _ "$src" "$stamp"
        fi
      ''}
      ${lib.optionalString (cfg.settings != { }) ''
        if [ -f "$live/settings.json" ]; then
          merged=$(${jq} -s '.[0] * .[1]' "$live/settings.json" ${settingsFile})
        else
          merged=$(cat ${settingsFile})
        fi
        run --quiet sh -c 'printf "%s\n" "$1" > "$2"' _ "$merged" "$live/settings.json"
      ''}
    '';
  };
}
