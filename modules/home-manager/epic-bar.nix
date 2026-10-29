{ inputs, lib, ... }:

{
  imports = [ inputs.epic-bar-rs.homeManagerModules.default ];

  # epic-bar-rs (top status bar + bottom task bar on every display), run as a
  # systemd user service with the Hyprland session. Each display's bars show
  # the workspaces Hyprland's workspace rules give it (see hyprland.nix).
  programs.epic-bar = {
    enable = true;
    # Matches Kitty's Autumn Light palette; hosts can pick "autumn-dark".
    theme = lib.mkDefault "autumn-light";
    settings = {
      # hyprland.nix binds workspaces 1-9; modifier+0 is the scratchpad.
      workspaces = 9;
    };
  };
}
