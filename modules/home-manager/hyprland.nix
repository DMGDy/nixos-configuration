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
    # Hyprland 0.56+ reads ~/.config/hypr/hyprland.lua; each settings
    # attribute becomes an hl.<name>(...) call.
    configType = "lua";

    settings = {
      config = {
        general = {
          gaps_in = 0;
          gaps_out = 0;
          layout = "master";
          border_size = 2;
          col = {
            active_border = "rgb(2d539e)";
            inactive_border = "rgb(c6c8d1)";
          };
        };
        master = {
          new_on_top = false;
          new_status = "master";
          mfact = 0.5;
          orientation = "top";
        };
        decoration = {
          blur = {
            enabled = true;
            size = 10;
            passes = 3;
            new_optimizations = true;
            xray = false;
          };
        };
        misc = {
          disable_splash_rendering = true;
          disable_hyprland_logo = true;
          mouse_move_enables_dpms = true;
          enable_swallow = true;
          swallow_regex = "^(sunshine)$";
        };
        cursor = {
          no_warps = false;
        };
        debug = {
          disable_logs = false;
        };
        input = {
          touchpad = {
            disable_while_typing = false;
            tap_to_click = false;
          };
        };
        binds = {
          allow_workspace_cycles = true;
        };
      };

      # monitor scaling down since default is 2
      monitor = [
        {
          output = "DP-4";
          mode = "2560x1440@120.000";
          position = "0x0";
          scale = 1.0;
        }
        {
          output = "";
          mode = "preferred";
          position = "auto";
          scale = "auto";
          bitdepth = 8;
        }
      ];

      # Every workspace lives on the primary display (DP-4) except workspace 4,
      # which stays on the secondary (DP-1).
      workspace_rule =
        map (ws: {
          workspace = toString ws;
          monitor = "DP-4";
          default = ws == 1;
        }) [ 1 2 3 5 6 7 8 9 ]
        ++ [
          {
            workspace = "4";
            monitor = "DP-1";
            default = true;
          }
        ];

      window_rule = [
        {
          name = "no-border-single-tiled";
          match = {
            workspace = "w[tv1] f[-1]";
            float = false;
          };
          border_size = 0;
        }
        {
          name = "opacity-ghostty";
          match.class = "^(ghostty)$";
          opacity = "0.9 0.85";
        }
        {
          name = "opacity-firefox";
          match.class = "^(firefox)$";
          opacity = "0.95 0.9";
        }
        {
          name = "opacity-neovide";
          match.class = "^(neovide)$";
          opacity = "0.95 0.9";
        }
      ];

      layer_rule = [
        {
          name = "epic-bar-blur";
          match.namespace = "^(epic-bar)$";
          blur = true;
          ignore_alpha = 0.05;
        }
      ];
    };

    extraConfig = ''
      hl.curve("easeOutQuint", { type = "bezier", points = { {0.23, 1.0}, {0.32, 1.0} } })

      hl.animation({ leaf = "workspaces", enabled = true, speed = 8, bezier = "easeOutQuint", style = "slidefade 30%" })
      hl.animation({ leaf = "windows",    enabled = true, speed = 8, bezier = "easeOutQuint", style = "popin 90%" })
      hl.animation({ leaf = "fade",       enabled = false })

      local mod = "SUPER"

      -- open ghostty
      hl.bind(mod .. " + SHIFT + Return", hl.dsp.exec_cmd("ghostty"))

      -- close focused client
      hl.bind(mod .. " + SHIFT + C", hl.dsp.window.close())

      -- close hyprland session
      hl.bind(mod .. " + SHIFT + Q", hl.dsp.exit())

      -- move focus
      hl.bind(mod .. " + J", hl.dsp.focus({ direction = "down" }))
      hl.bind(mod .. " + K", hl.dsp.focus({ direction = "up" }))
      hl.bind(mod .. " + H", hl.dsp.focus({ direction = "left" }))
      hl.bind(mod .. " + L", hl.dsp.focus({ direction = "right" }))

      -- switch workspaces / move focused client to workspace
      for i = 1, 9 do
        hl.bind(mod .. " + " .. i,             hl.dsp.focus({ workspace = i }))
        hl.bind(mod .. " + SHIFT + " .. i,     hl.dsp.window.move({ workspace = i }))
      end

      -- take screenshot and copy to clipboard
      hl.bind(mod .. " + S", hl.dsp.exec_cmd("grim -g \"$(slurp)\" - | swappy -f -"))

      -- change brightness
      hl.bind(mod .. " + SHIFT + K", hl.dsp.exec_cmd("brightnessctl s +5%"))
      hl.bind(mod .. " + SHIFT + J", hl.dsp.exec_cmd("brightnessctl s 5%-"))

      -- switch between previous workspace
      hl.bind("ALT + Tab",       hl.dsp.focus({ workspace = "previous" }))
      hl.bind(mod .. " + Tab",   hl.dsp.focus({ last = true }))

      -- toggle floating client
      hl.bind(mod .. " + F", hl.dsp.window.float({ action = "toggle" }))

      -- make current client fullscreen - keeping bar
      hl.bind(mod .. " + Space", hl.dsp.window.fullscreen({ mode = "maximized" }))

      -- make current client fullscreen - ignoring bar
      hl.bind(mod .. " + SHIFT + Space", hl.dsp.window.fullscreen())

      -- make focused client master
      hl.bind(mod .. " + Return", hl.dsp.layout("swapwithmaster master"))

      -- increase/decrease master clients (horizontal split behavior)
      hl.bind(mod .. " + I", hl.dsp.layout("addmaster"))
      hl.bind(mod .. " + D", hl.dsp.layout("removemaster"))

      -- toggle split orientation (top/bottom or left/right)
      hl.bind(mod .. " + O",         hl.dsp.layout("orientationtop"))
      hl.bind(mod .. " + SHIFT + O", hl.dsp.layout("orientationleft"))

      -- cycle focus in master layout
      hl.bind(mod .. " + M", hl.dsp.layout("focusmaster master"))

      -- resize focused client
      hl.bind(mod .. " + SHIFT + H", hl.dsp.window.resize({ x = -15, y = 0,   relative = true }))
      hl.bind(mod .. " + SHIFT + L", hl.dsp.window.resize({ x = 15,  y = 0,   relative = true }))
      hl.bind(mod .. " + SHIFT + K", hl.dsp.window.resize({ x = 0,   y = 15,  relative = true }))
      hl.bind(mod .. " + SHIFT + J", hl.dsp.window.resize({ x = 0,   y = -15, relative = true }))

      -- launch tofi, application launcher
      hl.bind(mod .. " + P", hl.dsp.exec_cmd("tofi-run | sh"))

      -- move/resize windows with mod + LMB/RMB
      hl.bind(mod .. " + mouse:272", hl.dsp.window.drag(),   { mouse = true })
      hl.bind(mod .. " + mouse:273", hl.dsp.window.resize(), { mouse = true })

      hl.on("hyprland.start", function()
        hl.exec_cmd("${startupScript}/bin/start")
        hl.exec_cmd("dbus-update-activation-environment --systemd WAYLAND_DISPLAY XDG_CURRENT_DESKTOP")
      end)
    '';
  };
}
