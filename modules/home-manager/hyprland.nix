{ pkgs, ... }:

let 
  startupScript = pkgs.pkgs.writeShellScriptBin "start" ''
    swww-daemon &
    #swww img /home/dylandy/Pictures/wps/nix.png &
    #swww clear-cache &
    eww open bar
  '';
in
{
  wayland.windowManager.hyprland = {
    enable = true;

    extraConfig = ''
      misc {
        disable_splash_rendering = true
        disable_hyprland_logo = true
      }
      decoration {
        blur {
          enabled = true
          size = 18
          passes = 1
          new_optimizations = true
          noise = 0.02
          
        }
      }
    '';
    settings = {
      general = {
        gaps_in = "0";
        gaps_out = "0";
        windowrulev2 = "noborder, onworkspace:w[tv1] f[-1], floating:0";
      };
      # monitor scaling down since default is 2
      monitor = [
        "eDP-1,2256x1504@59.999,0x0,1.566667"
        ",preferred,auto,1,mirror,eDP-1"
      ];

      "$mod" = "Alt";
      "debug:disable_logs" = "false";

      input = {
        touchpad = {
          disable_while_typing = false;
          tap-to-click = false;
        };
      };

      binds = {
        "allow_workspace_cycles" = true;
      };
        

      bind = [
        # open kitty
        "SHIFT_ALT, Return, exec, kitty"

        # close focused client
        "SHIFT_ALT, C, killactive"

        # close hyprland session
        "SHIFT_ALT, Q, exit"

        # move focused client
        "Alt, J, movefocus, d"
        "Alt, K, movefocus, u"
        "Alt, H, movefocus, l"
        "Alt, L, movefocus, r"

        # switch workspaces
        "Alt, 1, workspace, 1"
        "Alt, 2, workspace, 2"
        "Alt, 3, workspace, 3"
        "Alt, 4, workspace, 4"
        "Alt, 5, workspace, 5"
        "Alt, 6, workspace, 6"
        "Alt, 7, workspace, 7"
        "Alt, 8, workspace, 8"
        "Alt, 9, workspace, 9"


        # Take screenshot and copy to clipboard
        "Alt, s, exec, grim -g \"$(slurp)\" - | swappy -f -"

        #change brightness
        "SUPERSHIFT, k, exec, brightnessctl s +5%"
        "SUPERSHIFT, j, exec, brightnessctl s 5%-"

        # switch between previous workspace
        "Alt, Tab,workspace, previous"

        # toggle floating client
        "Alt, F, togglefloating" 

        # move focused client to workspace
        "SHIFT_ALT, 1, movetoworkspace, 1"
        "SHIFT_ALT, 2, movetoworkspace, 2"
        "SHIFT_ALT, 3, movetoworkspace, 3"
        "SHIFT_ALT, 4, movetoworkspace, 4"
        "SHIFT_ALT, 5, movetoworkspace, 5"
        "SHIFT_ALT, 6, movetoworkspace, 6"
        "SHIFT_ALT, 7, movetoworkspace, 7"
        "SHIFT_ALT, 8, movetoworkspace, 8"
        "SHIFT_ALT, 9, movetoworkspace, 9"

        # make current client fullscreen
        "Alt, Space, fullscreen, 1"

        # make focused client to master
        "Alt, Return, movewindow, l"

        # resize focused client
        "SHIFT_ALT, H, resizeactive, -15 0"
        "SHIFT_ALT, L, resizeactive, 15 0"
        "SHIFT_ALT, K, resizeactive, 0 15"
        "SHIFT_ALT, J, resizeactive, 0 -15"

        # launch tofi, application launcher
        "Alt, p, exec, tofi-run | xargs hyprctl dispatch exec"
      ];
      bindm = [
        "ALT, mouse:272, movewindow"
        "ALT, mouse:273, resizewindow"
      ];
      # "plugin:borders-plus-plus" = {
      #   add_borders = 1;

      #   # can add up to 9 borders
      #   "col.border_1" = "rgb(ffffff)";
      #   "col.border_2" = "rgb(2222ff)";

      #   border_size_1 = 10;
      #   border_size_2 = -1;

      #   natural_rounding = "no";
      # };
      exec-once = [
        "${startupScript}/bin/start"
        "dbus-update-activation-environment --systemd WAYLAND_DISPLAY XDG_CURRENT_DESKTOP"
      ];
    };
  };
}
