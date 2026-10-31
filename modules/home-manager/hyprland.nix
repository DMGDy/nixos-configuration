{ config, lib, pkgs, ... }:

let
  monitors = config.hyprland.monitors;
  # The scratchpad: one terminal showing the date and a three-month
  # calendar above an interactive shell.
  scratchpad = pkgs.writeShellScript "scratchpad" ''
    clear
    printf '\033[1m%s\033[0m\n\n' "$(date '+%A, %-d %B %Y')"
    cal -3
    echo
    exec "''${SHELL:-zsh}"
  '';
  # Small utility windows float centered instead of tiling into odd splits.
  floating = [
    { name = "float-volume"; match.class = "^(com[.]saivert[.]pwvucontrol|org[.]pulseaudio[.]pavucontrol)$"; size = "monitor_w*0.4 monitor_h*0.55"; }
    { name = "float-bluetooth"; match.class = "^(blueman-manager|[.]blueman-manager-wrapped)$"; size = "monitor_w*0.4 monitor_h*0.55"; }
    { name = "float-network"; match.class = "^(nm-connection-editor)$"; size = "monitor_w*0.4 monitor_h*0.55"; }
    { name = "float-file-dialogs"; match.class = "^(xdg-desktop-portal-gtk)$"; size = "monitor_w*0.55 monitor_h*0.65"; }
    { name = "float-firefox-library"; match = { class = "^(firefox)$"; title = "^(Library)$"; }; size = "monitor_w*0.5 monitor_h*0.6"; }
    { name = "float-steam-popups"; match = { class = "^(steam)$"; title = "^(Special Offers|Steam Settings|Friends List)$"; }; }
    { name = "float-imv"; match.class = "^(imv)$"; size = "monitor_w*0.6 monitor_h*0.7"; }
    { name = "float-dialogs"; match.modal = true; }
  ];
  startupScript = pkgs.writeShellScriptBin "start" ''
    awww-daemon &
    # The daemon only restores wallpapers it has cached for an output; any
    # output still showing a plain color (e.g. a newly used display) gets
    # the default wallpaper.
    for _ in $(seq 50); do
      awww query >/dev/null 2>&1 && break
      sleep 0.1
    done
    wallpaper=${lib.escapeShellArg config.hyprland.wallpaper}
    if [ -f "$wallpaper" ]; then
      awww query | grep -v "currently displaying: image:" \
        | sed -n 's/^: \([^:]*\):.*/\1/p' \
        | while read -r output; do
            awww img --outputs "$output" "$wallpaper"
          done
    fi
  '';
in
{
  options.hyprland.modifier = lib.mkOption {
    type = lib.types.str;
    default = "ALT";
    description = "Main modifier for Hyprland key and mouse bindings.";
  };

  options.hyprland.scratchpadCommand = lib.mkOption {
    type = lib.types.str;
    default = toString scratchpad;
    description = "Command launched inside the Kitty scratchpad terminal.";
  };

  options.hyprland.wallpaper = lib.mkOption {
    type = lib.types.str;
    default = "${config.home.homeDirectory}/Pictures/wp.png";
    description = "Wallpaper for outputs awww has no cached image for.";
  };

  options.hyprland.monitors = {
    fallbackMode = lib.mkOption {
      type = lib.types.str;
      default = "highrr";
      description = "Mode selection for displays without an explicit monitor rule.";
    };
    primary = lib.mkOption {
      type = lib.types.str;
      default = "DP-4";
      description = "Output that holds every workspace except 4-6.";
    };
    secondary = lib.mkOption {
      type = lib.types.str;
      default = "DP-1";
      description = "Output dedicated to workspaces 4-6.";
    };
  };

  config.wayland.windowManager.hyprland = {
    enable = true;
    # Hyprland 0.56+ reads ~/.config/hypr/hyprland.lua; each settings
    # attribute becomes an hl.<name>(...) call.
    configType = "lua";

    settings = {
      config = {
        general = {
          gaps_in = 4;
          gaps_out = 8;
          layout = "master";
          border_size = 2;
          col = {
            active_border = {
              colors = [ "rgb(8c1612)" "rgb(c57339)" ];
              angle = 45;
            };
            inactive_border = "rgb(d9c5b9)";
          };
        };
        master = {
          new_on_top = false;
          new_status = "master";
          mfact = 0.5;
          orientation = "top";
        };
        decoration = {
          rounding = 10;
          shadow = {
            enabled = true;
            range = 16;
            render_power = 3;
            color = "rgba(38231e30)";
            color_inactive = "rgba(38231e1a)";
            offset = [ 0 3 ];
          };
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
        # Other displays follow the host's automatic mode-selection policy.
        {
          output = "";
          mode = monitors.fallbackMode;
          position = "auto";
          scale = "auto";
          bitdepth = 8;
        }
      ];

      # Workspaces stop at 9 (0 is the scratchpad). 4-6 live on the secondary display and
      # the rest on the primary; each display opens on its first workspace, so
      # Hyprland never has to invent a workspace beyond 10 for it.
      workspace_rule =
        map (ws: {
          workspace = toString ws;
          monitor = monitors.primary;
          default = ws == 1;
        }) [ 1 2 3 7 8 9 ]
        ++ map (ws: {
          workspace = toString ws;
          monitor = monitors.secondary;
          default = ws == 4;
        }) [ 4 5 6 ]
        ++ [
          {
            # Opening the scratchpad starts its terminal if it is not running.
            workspace = "special:scratch";
            on_created_empty = "kitty --class scratchpad -e ${config.hyprland.scratchpadCommand}";
          }
          {
            workspace = "w[tv1] f[-1]";
            gaps_in = 0;
            gaps_out = 0;
          }
        ];

      window_rule = map (rule: { float = true; center = true; } // rule) floating ++ [
        {
          name = "scratchpad";
          match.class = "^(scratchpad)$";
          workspace = "special:scratch";
          float = true;
          center = true;
          size = "monitor_w*0.6 monitor_h*0.6";
        }
        {
          name = "flush-single-tiled";
          match = {
            workspace = "w[tv1] f[-1]";
            float = false;
          };
          border_size = 0;
          rounding = 0;
        }
        {
          name = "no-shadow-tiled";
          match.float = false;
          no_shadow = true;
        }
        {
          name = "opacity-terminal";
          match.class = "^(kitty|herdr|ghostty|com[.]mitchellh[.]ghostty)$";
          opacity = "1.0 1.0";
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
          # Epic Bar currently uses GTK layer-shell's default namespace.
          match.namespace = "^(epic-bar|gtk4-layer-shell)$";
          blur = true;
          ignore_alpha = 0.05;
          no_anim = true;
        }
        {
          name = "launcher-fade";
          match.namespace = "^(desktop-launcher)$";
          animation = "fade";
        }
        {
          name = "notification-slide";
          match.namespace = "^(notifications)$";
          animation = "slide top";
        }
      ];
    };

    extraConfig = ''
      hl.curve("easeOutQuint", { type = "bezier", points = { {0.23, 1.0}, {0.32, 1.0} } })

      -- Speeds are deciseconds, matching the bar's 200 ms motion.
      hl.animation({ leaf = "workspaces", enabled = true, speed = 2.5, bezier = "easeOutQuint", style = "slidefade 20%" })
      hl.animation({ leaf = "windows", enabled = true, speed = 2, bezier = "easeOutQuint", style = "popin 95%" })
      hl.animation({ leaf = "windowsOut", enabled = true, speed = 1.5, bezier = "easeOutQuint", style = "popin 97%" })
      hl.animation({ leaf = "border", enabled = true, speed = 2, bezier = "easeOutQuint" })
      hl.animation({ leaf = "fade",       enabled = false })
      hl.animation({ leaf = "layers", enabled = true, speed = 1.8, bezier = "easeOutQuint", style = "fade" })
      hl.animation({ leaf = "fadeLayers", enabled = true, speed = 1.5, bezier = "easeOutQuint" })
      hl.animation({ leaf = "specialWorkspace", enabled = true, speed = 2.5, bezier = "easeOutQuint", style = "slidefadevert 20%" })

      local mod = ${builtins.toJSON config.hyprland.modifier}

      -- open primary terminal
      hl.bind(mod .. " + SHIFT + Return", hl.dsp.exec_cmd("kitty"))

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

      -- show/hide the scratchpad terminal (special workspace) on 0
      hl.bind(mod .. " + 0", hl.dsp.workspace.toggle_special("scratch"))

      -- take screenshot and copy to clipboard
      hl.bind(mod .. " + S", hl.dsp.exec_cmd("grim -g \"$(slurp)\" - | swappy -f -"))

      -- change brightness
      hl.bind(mod .. " + SHIFT + K", hl.dsp.exec_cmd("brightnessctl s +5%"))
      hl.bind(mod .. " + SHIFT + J", hl.dsp.exec_cmd("brightnessctl s 5%-"))

      -- switch between previous workspace
      hl.bind(mod .. " + Tab",   hl.dsp.focus({ workspace = "previous" }))

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

      -- launch applications and PATH commands
      hl.bind(mod .. " + P", hl.dsp.exec_cmd("fuzzel"))

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
