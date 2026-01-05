{ pkgs, ... }:

let 
  startupScript = pkgs.pkgs.writeShellScriptBin "start" ''
    swww-daemon &
    swww img /home/dylandy/Pictures/wps/nix.png &
    swww clear-cache &
  '';
in
{
  wayland.windowManager.hyprland = {
    enable = true;

    extraConfig = ''
      misc {
        disable_splash_rendering = true
        disable_hyprland_logo = true
        mouse_move_enables_dpms = true
        enable_swallow = true
        swallow_regex = ^(sunshine)$
      }
      decoration {
        blur {
          enabled = true
          size = 8
          passes = 2
          new_optimizations = true
          noise = 0.01
          
        }
      }
    '';
    settings = {
      general = {
        gaps_in = "0";
        gaps_out = "0";
        windowrulev2 = "noborder, onworkspace:w[tv1] f[-1], floating:0";
        animation = [
          "workspaces, 1, 8, default, slidefade 20%"
          "windows, 1, 8, default, popin 80%"
          "fade, 0"
        ];
      };
      cursor = {
        no_warps = false;
      };
      # monitor scaling down since default is 2
      monitor = [
        "eDP-1,2256x1504@59.999,0x0,1.566667"
        ",preferred,auto,auto,bitdepth,8"
      ];

      "$mod" = "Super";
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
        # open ghostty
        "SHIFT_SUPER, Return, exec, ghostty"

        # close focused client
        "SHIFT_SUPER, C, killactive"

        # close hyprland session
        "SHIFT_SUPER, Q, exit"

        # move focused client
        "Super, J, movefocus, d"
        "Super, K, movefocus, u"
        "Super, H, movefocus, l"
        "Super, L, movefocus, r"

        # switch workspaces
        "Super, 1, workspace, 1"
        "Super, 2, workspace, 2"
        "Super, 3, workspace, 3"
        "Super, 4, workspace, 4"
        "Super, 5, workspace, 5"
        "Super, 6, workspace, 6"
        "Super, 7, workspace, 7"
        "Super, 8, workspace, 8"
        "Super, 9, workspace, 9"


        # Take screenshot and copy to clipboard
        "Super, s, exec, grim -g \"$(slurp)\" - | swappy -f -"

        #change brightness
        "SUPERSHIFT, k, exec, brightnessctl s +5%"
        "SUPERSHIFT, j, exec, brightnessctl s 5%-"

        # switch between previous workspace
        "Super, Tab,workspace, previous"
        "Alt, Tab, focuscurrentorlast"

        # toggle floating client
        "Super, F, togglefloating" 

        # move focused client to workspace
        "SHIFT_SUPER, 1, movetoworkspace, 1"
        "SHIFT_SUPER, 2, movetoworkspace, 2"
        "SHIFT_SUPER, 3, movetoworkspace, 3"
        "SHIFT_SUPER, 4, movetoworkspace, 4"
        "SHIFT_SUPER, 5, movetoworkspace, 5"
        "SHIFT_SUPER, 6, movetoworkspace, 6"
        "SHIFT_SUPER, 7, movetoworkspace, 7"
        "SHIFT_SUPER, 8, movetoworkspace, 8"
        "SHIFT_SUPER, 9, movetoworkspace, 9"

        # make current client fullscreen - keeping bar
        "Super, Space, fullscreen, 1"

        # make current client fullscreen - ignoring bar
        "SHIFT_SUPER, Space, fullscreen"

        # make focused client to master
        "Super, Return, movewindow, l"

        # resize focused client
        "SHIFT_SUPER, H, resizeactive, -15 0"
        "SHIFT_SUPER, L, resizeactive, 15 0"
        "SHIFT_SUPER, K, resizeactive, 0 15"
        "SHIFT_SUPER, J, resizeactive, 0 -15"

        # launch tofi, application launcher
        "Super, p, exec, tofi-run | xargs hyprctl dispatch exec"
      ];
      bindm = [
        "SUPER, mouse:272, movewindow"
        "SUPER, mouse:273, resizewindow"
      ];
      exec-once = [
        "${startupScript}/bin/start"
        "dbus-update-activation-environment --systemd WAYLAND_DISPLAY XDG_CURRENT_DESKTOP"
      ];
    };
  };
}
