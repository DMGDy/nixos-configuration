{ config, lib, pkgs, ... }:

let
  # Text files open in Neovim inside Kitty (Vim where Neovim is missing).
  openInEditor = pkgs.writeShellScriptBin "open-in-editor" ''
    if command -v nvim >/dev/null 2>&1; then editor=nvim; else editor=vim; fi
    exec kitty --class editor -e "$editor" "$@"
  '';

  # Extract a zip next to itself into a directory named after it (adding a
  # numeric suffix instead of merging into an existing directory), then open
  # a terminal there.
  unzipHere = pkgs.writeShellScriptBin "unzip-here" ''
    set -u
    archive=$(readlink -f "$1")
    parent=$(dirname "$archive")
    name=$(basename "$archive")
    name=''${name%.[zZ][iI][pP]}
    target="$parent/$name"
    n=1
    while [ -e "$target" ]; do
      target="$parent/$name-$n"
      n=$((n + 1))
    done
    mkdir -p "$target"
    if ! ${pkgs.unzip}/bin/unzip -q "$archive" -d "$target"; then
      ${pkgs.libnotify}/bin/notify-send -u critical "Could not extract $(basename "$archive")" "$archive"
      rm -rf "$target"
      exit 1
    fi
    exec kitty --directory "$target"
  '';

  editor = "nvim-kitty.desktop";
  pdf = "org.pwmt.zathura-pdf-mupdf.desktop";
  image = "imv.desktop";
  media = "mpv.desktop";
  browser = "firefox.desktop";

  # Text formats worth naming explicitly. Every other text/* type inherits
  # from text/plain, which GIO (and so Firefox's "Open") falls back to, so
  # unknown text files still open in the editor while binaries do not.
  textTypes = [
    "text/plain" "text/markdown" "text/x-markdown" "text/csv" "text/tab-separated-values"
    "text/x-log" "text/x-python" "text/x-python3" "text/x-csrc" "text/x-chdr"
    "text/x-c++src" "text/x-c++hdr" "text/x-rust" "text/x-go" "text/x-java"
    "text/x-lua" "text/x-nix" "text/x-patch" "text/x-diff" "text/x-makefile"
    "text/x-cmake" "text/css" "text/javascript" "text/x-tex" "text/x-yaml"
    "application/json" "application/x-yaml" "application/yaml" "application/toml"
    "application/xml" "application/x-shellscript" "application/x-perl"
    "application/javascript" "application/x-subrip" "application/x-desktop"
    "application/sql" "application/x-ini-file"
  ];
  imageTypes = [
    "image/png" "image/jpeg" "image/gif" "image/webp" "image/bmp" "image/tiff"
    "image/svg+xml" "image/avif" "image/heif" "image/jxl" "image/x-portable-pixmap"
  ];
  mediaTypes = [
    "video/mp4" "video/webm" "video/x-matroska" "video/quicktime" "video/x-msvideo"
    "video/mpeg" "video/ogg" "video/x-flv" "audio/mpeg" "audio/flac" "audio/ogg"
    "audio/opus" "audio/wav" "audio/x-wav" "audio/aac" "audio/mp4" "audio/x-m4a"
  ];
  office = {
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document" = "writer.desktop";
    "application/msword" = "writer.desktop";
    "application/vnd.oasis.opendocument.text" = "writer.desktop";
    "application/rtf" = "writer.desktop";
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" = "calc.desktop";
    "application/vnd.ms-excel" = "calc.desktop";
    "application/vnd.oasis.opendocument.spreadsheet" = "calc.desktop";
    "application/vnd.openxmlformats-officedocument.presentationml.presentation" = "impress.desktop";
    "application/vnd.ms-powerpoint" = "impress.desktop";
    "application/vnd.oasis.opendocument.presentation" = "impress.desktop";
  };
  all = app: types: lib.genAttrs types (_: app);
in
{
  home.packages = [ openInEditor unzipHere ];

  xdg.desktopEntries = {
    nvim-kitty = {
      name = "Neovim (Kitty)";
      genericName = "Text Editor";
      exec = "open-in-editor %F";
      icon = "nvim";
      terminal = false;
      categories = [ "Utility" "TextEditor" ];
      mimeType = textTypes;
    };
    unzip-here = {
      name = "Extract Here";
      exec = "unzip-here %f";
      icon = "package-x-generic";
      terminal = false;
      noDisplay = true;
      mimeType = [ "application/zip" "application/x-zip-compressed" ];
    };
  };

  xdg.mimeApps = {
    enable = true;
    defaultApplications =
      all editor textTypes
      // all image imageTypes
      // all media mediaTypes
      // office
      // all browser [
        "text/html" "application/xhtml+xml" "x-scheme-handler/http"
        "x-scheme-handler/https" "x-scheme-handler/chrome"
        "application/x-extension-htm" "application/x-extension-html"
        "application/x-extension-shtml" "application/x-extension-xhtml"
        "application/x-extension-xht"
      ]
      // {
        "application/pdf" = pdf;
        "application/epub+zip" = pdf;
        "application/postscript" = "org.pwmt.zathura-ps.desktop";
        "image/vnd.djvu" = "org.pwmt.zathura-djvu.desktop";
        "application/vnd.comicbook+zip" = "org.pwmt.zathura-cb.desktop";
        "application/zip" = "unzip-here.desktop";
        "application/x-zip-compressed" = "unzip-here.desktop";
        "x-scheme-handler/claude-cli" = "claude-code-url-handler.desktop";
      };
  };

  # Replace the hand-edited mimeapps.list; its entries are carried over above.
  xdg.configFile."mimeapps.list".force = true;
}
