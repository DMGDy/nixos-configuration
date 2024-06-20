{ pkgs, ... }:

let 
  startupScript = pkgs.pkgs.writeShellScriptBin "start" ''
    swww-daemon &

    sleep 1 &
    swww img ${/home/dylandy/Pictures/wps/nixos-anime.png}&
  '';
in
{
  wayland.windowManager.hyprland = {
    enable = true;
    plugins = [
      # inputs.hyprland-plugins.packages."${pkgs.system}".borders-plus-plus
    ];

    settings = {
      # monitor scaling down since default is 2
      monitor = "eDP-1,2256x1504@59.999,0x0,1.175";

      "$mod" = "Alt";
      "debug:disable_logs" = "false";

      bind = [
        # open kitty
        "SHIFT_ALT, Return, exec, kitty"

        # close focused client
        "SHIFT_ALT, C, killactive"

        # close hyprland session
        "SHIFT_ALT, Q, exit"

        # move focused client
        "Alt, J, movefocus, l"
        "Alt, K, movefocus, r"
        "Alt, H, movefocus, d"
        "Alt, L, movefocus, u"

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
        "Alt, s, exec, hyprshot -m region --clipboard-only"

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
        "Alt, Space, fullscreen"

        # make focused client to master
        "Alt, Return, movewindow, l"

        # resize focused client
        "SHIFT_ALT, H, resizeactive, -15 0"
        "SHIFT_ALT, L, resizeactive, 15 0"
        "SHIFT_ALT, K, resizeactive, 0 15"
        "SHIFT_ALT, J, resizeactive, 0 -15"

        # launch tofi
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
      exec-once = "${startupScript}/bin/start";
    };
  };
}
