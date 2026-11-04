{ pkgs, ... }:

let
  # Vim-style modal editing for pi's prompt editor (npm "pi-vim", pi.dev/packages/pi-vim).
  # It has no runtime dependencies and pi loads its TypeScript directly, so the
  # source tree is linked into pi's global extensions directory as is.
  pi-vim = pkgs.fetchFromGitHub {
    owner = "lajarre";
    repo = "pi-vim";
    rev = "v0.14.2";
    hash = "sha256-y8qsUKdzAM2yQyNDKWqGBHA139tDDYJlefvT+nVhGKQ=";
  };
in
{
  home.packages = [ pkgs.pi-coding-agent ];

  # Only this subdirectory is managed; other extensions in the directory stay user-owned.
  home.file.".pi/agent/extensions/pi-vim".source = pi-vim;
}
