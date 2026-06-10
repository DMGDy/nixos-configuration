{ pkgs, ... }:

let 
  startupScript = pkgs.pkgs.writeShellScriptBin "start" ''
    awww-daemon &
    awww img /home/dylandy/Pictures/wps/nix.png &
    awww clear-cache &
  '';
in
{
  wayland.windowManager.hyprland = {
    enable = true;
    configType = "hyprlang";

    extraConfig = ''
      misc {
        disable_splash_rendering = true
        disable_hyprland_logo = true
        mouse_move_enables_dpms = true
        enable_swallow = true
        swallow_regex = ^(sunshine)$
      }

      layerrule = blur true, match:namespace ^(epic-bar)$
      layerrule = ignore_alpha 0.05, match:namespace ^(epic-bar)$

      decoration {
        blur {
          enabled = true
          size = 10
          passes = 3
          new_optimizations = true
          xray = false
        }
      }
    '';
    settings = {
      general = {
        gaps_in = "0";
        gaps_out = "0";
        layout = "master";
        border_size = 2;
        "col.active_border" = "rgb(2d539e)";
        "col.inactive_border" = "rgb(c6c8d1)";
      };
      master = {
        new_on_top = false;
        new_status = "master";
        mfact = 0.5;
        orientation = "top";
      };
      windowrule = [
        "border_size 0, match:workspace w[tv1] f[-1], match:float 0"
        "opacity 0.9 0.85, match:class ^(ghostty)$"
        "opacity 0.95 0.9, match:class ^(firefox)$"
        "opacity 0.95 0.9, match:class ^(neovide)$"
      ];
      animation = [
        "workspaces, 1, 8, easeOutQuint, slidefade 30%"
        "windows, 1, 8, easeOutQuint, popin 90%"
        "fade, 0"
      ];
      bezier = "easeOutQuint, 0.23, 1.0, 0.32, 1.0";
      cursor = {
        no_warps = false;
      };
      # monitor scaling down since default is 2
      monitor = [
        "DP-4,2560x1440@120.000,0x0,1.0"
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
        "Alt, Tab,workspace, previous"
        "Super, Tab, focuscurrentorlast"

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
        "Super, Return, layoutmsg, swapwithmaster master"

        # increase/decrease master clients (horizontal split behavior)
        "Super, I, layoutmsg, addmaster"
        "Super, D, layoutmsg, removemaster"

        # toggle split orientation (top/bottom or left/right)
        "Super, O, layoutmsg, orientationtop"
        "SHIFT_SUPER, O, layoutmsg, orientationleft"

        # cycle focus in master layout
        "Super, M, layoutmsg, focusmaster master"

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
