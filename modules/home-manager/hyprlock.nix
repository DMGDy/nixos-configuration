{ config, lib, pkgs, ... }:

# Lock screen (hyprlock) and idle handling (hypridle). Idle only locks and
# blanks the monitors; nothing here suspends the machine.
let
  cfg = config.hyprlock;
  lain = import ./hyprlock/lain.nix { inherit config lib pkgs; };
  hyprctl = "${config.wayland.windowManager.hyprland.package}/bin/hyprctl";
  hyprlock = "${config.programs.hyprlock.package}/bin/hyprlock";
  loginctl = "${pkgs.systemd}/bin/loginctl";
  pidof = "${pkgs.procps}/bin/pidof";
  dpms = action: "${hyprctl} dispatch 'hl.dsp.dpms({ action = \"${action}\" })'";

  # Palette picked from the lockscreen image: slate background, the two
  # NixOS snowflake blues, white hair, red ribbon.
  white = "rgb(eef2f7)";
  lightBlue = "rgb(7eb7e5)";
  nixBlue = "rgb(5277c3)";
  slate = "rgba(2b3240d9)";
  red = "rgb(d6404e)";
  amber = "rgb(f0b65a)";

  font = "Iosevka NF";
  shadow = {
    shadow_passes = 2;
    shadow_size = 4;
    shadow_color = "rgba(0b0f18aa)";
  };
in
{
  options.hyprlock = {
    style = lib.mkOption {
      type = lib.types.enum [ "image" "lain" ];
      default = "image";
      description = ''
        "image": clock and password field over `image`. "lain": an animated
        Copland OS screen after Serial Experiments Lain (hyprlock/lain.nix).
      '';
    };
    image = lib.mkOption {
      type = lib.types.str;
      default = "${config.home.homeDirectory}/Pictures/lockscreen.png";
      description = "Lock screen background image.";
    };
    lockAfter = lib.mkOption {
      type = lib.types.int;
      default = 600;
      description = "Seconds idle before locking.";
    };
    screenOffAfter = lib.mkOption {
      type = lib.types.int;
      default = 660;
      description = "Seconds idle before turning the monitors off.";
    };
  };

  config = {
    # Styled here; don't let Stylix override the colors and background.
    stylix.targets.hyprlock.enable = false;

    programs.hyprlock = {
      enable = true;
      settings = if cfg.style == "lain" then lain.settings else {
        general = {
          hide_cursor = true;
          ignore_empty_input = true;
        };

        animations = {
          enabled = true;
          bezier = "easeOutQuint, 0.23, 1, 0.32, 1";
          animation = [
            "fadeIn, 1, 5, easeOutQuint"
            "fadeOut, 1, 5, easeOutQuint"
            "inputFieldDots, 1, 2, easeOutQuint"
          ];
        };

        background = [{
          monitor = "";
          path = cfg.image;
          color = "rgb(394150)"; # if the image is missing
          blur_passes = 0;
          brightness = 0.9;
        }];

        # Left: stacked clock beside a snowflake-blue accent bar, clear of the
        # figure in the middle of the image.
        shape = [({
          monitor = "";
          size = "8, 360";
          color = nixBlue;
          rounding = 4;
          halign = "left";
          valign = "center";
          position = "90, 40";
        } // shadow)];

        label = [
          ({
            monitor = "";
            text = ''cmd[update:1000] date +%H'';
            color = white;
            font_size = 170;
            font_family = "${font} ExtraBold";
            halign = "left";
            valign = "center";
            position = "125, 135";
          } // shadow)
          ({
            monitor = "";
            text = ''cmd[update:1000] date +%M'';
            color = lightBlue;
            font_size = 170;
            font_family = "${font} ExtraBold";
            halign = "left";
            valign = "center";
            position = "125, -55";
          } // shadow)
          ({
            monitor = "";
            text = ''cmd[update:60000] date +"%A, %d %B"'';
            color = white;
            font_size = 24;
            font_family = "${font} Medium";
            halign = "left";
            valign = "center";
            position = "130, -195";
          } // shadow)

          # Right: greeting above the password field, status below it.
          ({
            monitor = "";
            text = ''<span foreground="##7eb7e5">hey,</span> $USER'';
            color = white;
            font_size = 30;
            font_family = "${font} Bold";
            halign = "right";
            valign = "center";
            position = "-130, 95";
          } // shadow)
          ({
            monitor = "";
            text = ''cmd[update:60000] echo "󰅐  $(uptime -p | sed 's/^up //')"'';
            color = "rgba(eef2f7cc)";
            font_size = 15;
            font_family = font;
            halign = "right";
            valign = "center";
            position = "-130, -55";
          } // shadow)
          ({
            monitor = "";
            text = "  $LAYOUT";
            color = "rgba(eef2f7cc)";
            font_size = 15;
            font_family = font;
            halign = "right";
            valign = "center";
            position = "-130, -85";
          } // shadow)
          ({
            monitor = "";
            text = ''cmd[update:3600000] echo "<span foreground=\"##7eb7e5\"></span>  $(hostname)"'';
            color = "rgba(eef2f799)";
            font_size = 14;
            font_family = font;
            halign = "right";
            valign = "bottom";
            position = "-40, 30";
          })
        ];

        input-field = [({
          monitor = "";
          size = "380, 62";
          outline_thickness = 3;
          outer_color = "${lightBlue} ${nixBlue} 45deg";
          inner_color = slate;
          font_color = white;
          font_family = font;
          check_color = "${amber} ${nixBlue} 45deg";
          fail_color = red;
          capslock_color = amber;
          rounding = 14;
          dots_size = 0.24;
          dots_spacing = 0.35;
          dots_center = true;
          fade_on_empty = false;
          placeholder_text = ''<i><span foreground="##eef2f799">password…</span></i>'';
          fail_text = "<i>$FAIL <b>($ATTEMPTS)</b></i>";
          halign = "right";
          valign = "center";
          position = "-130, 25";
        } // shadow)];
      };
    };

    home.packages = lib.optionals (cfg.style == "lain") lain.packages;
    # Lets hyprlock find the VT323 font from home.packages by name.
    fonts.fontconfig.enable = lib.mkIf (cfg.style == "lain") true;

    services.hypridle = {
      enable = true;
      settings = {
        general = {
          lock_cmd = "${pidof} hyprlock || ${hyprlock}";
          before_sleep_cmd = "${loginctl} lock-session";
          after_sleep_cmd = dpms "on";
        };
        listener = [
          {
            timeout = cfg.lockAfter;
            on-timeout = "${loginctl} lock-session";
          }
          {
            timeout = cfg.screenOffAfter;
            on-timeout = dpms "off";
            on-resume = dpms "on";
          }
          # Locked by hand and left alone: blank the monitors sooner.
          {
            timeout = 60;
            on-timeout = "${pidof} hyprlock && ${dpms "off"}";
            on-resume = dpms "on";
          }
        ];
      };
    };

    wayland.windowManager.hyprland.extraConfig = ''
      hl.bind(${builtins.toJSON "${config.hyprland.modifier} + CTRL + L"}, hl.dsp.exec_cmd("${loginctl} lock-session"))
    '';
  };
}
