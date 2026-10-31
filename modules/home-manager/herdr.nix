{ config, lib, pkgs, ... }:

let
  terminal = pkgs.writeShellScriptBin "herdr-terminal" ''
    unset TMUX TMUX_PANE HERDR_ENV HERDR_PANE_ID HERDR_TAB_ID HERDR_WORKSPACE_ID HERDR_SOCKET_PATH
    exec ${lib.getExe config.programs.kitty.package} --class herdr --title Herdr \
      -e ${lib.getExe config.programs.herdr.package} "$@"
  '';
in
{
  programs.herdr = {
    enable = true;
    settings = {
      onboarding = false;
      theme.name = "terminal";
      terminal.new_cwd = "follow";
      ui = {
        prompt_new_tab_name = false;
        tab_bar_position = "bottom";
        tab_bar_right = [
          { type = "hostname"; }
          { type = "zoom"; }
        ];
      };
      keys = {
        prefix = "ctrl+a";
        focus_pane_left = [ "ctrl+h" "prefix+h" ];
        focus_pane_down = [ "ctrl+j" "prefix+j" ];
        focus_pane_up = [ "ctrl+k" "prefix+k" ];
        focus_pane_right = [ "ctrl+l" "prefix+l" ];
        resize_pane_left = "prefix+ctrl+h";
        resize_pane_down = "prefix+ctrl+j";
        resize_pane_up = "prefix+ctrl+k";
        resize_pane_right = "prefix+ctrl+l";
        split_vertical = [ "prefix+%" "prefix+v" ];
        split_horizontal = [ "prefix+\"" "prefix+minus" ];
        new_tab = "prefix+c";
        next_tab = "prefix+n";
        previous_tab = "prefix+p";
        switch_tab = "prefix+1..9";
        rename_tab = [ "prefix+comma" "prefix+shift+t" ];
        close_tab = [ "prefix+ampersand" "prefix+shift+x" ];
        workspace_picker = [ "prefix+s" "prefix+w" ];
        settings = "prefix+shift+s";
        # Herdr's MRU action follows panes, including across tabs/workspaces.
        last_pane = [ "ctrl+s" "prefix+a" ];
        detach = [ "prefix+d" "prefix+q" ];
        zoom = "prefix+z";
        copy_mode = "prefix+[";
      };
    };
  };

  home.packages = [ terminal ];

  xdg.desktopEntries.herdr = {
    name = "Herdr";
    genericName = "Coding agent workspace";
    comment = "Herdr TUI in Kitty, alongside existing tmux sessions";
    exec = "${terminal}/bin/herdr-terminal";
    icon = "utilities-terminal";
    terminal = false;
    categories = [ "Development" "TerminalEmulator" ];
  };

  wayland.windowManager.hyprland.extraConfig =
    lib.mkIf config.wayland.windowManager.hyprland.enable ''
      hl.bind(${builtins.toJSON "${config.hyprland.modifier} + CTRL + Return"}, hl.dsp.exec_cmd("${terminal}/bin/herdr-terminal"))
    '';
}
