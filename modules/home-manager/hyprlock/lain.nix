{ config, lib, pkgs }:

# "Copland OS" lock screen after Serial Experiments Lain: the NAVI boot
# screen (navy, scanlines, the glowing eye logo), a typed-out boot log, a
# ticking PRESENT DAY / PRESENT TIME clock and the occasional laugh.
#
# The show's frame isn't in the repo (it's public): ./lain-assets.sh fetches
# it into ./assets (gitignored) and bakes three glow strengths that hyprlock
# cross-fades between, so the logo breathes. Without them the screen falls
# back to generated navy frames and a text logo.
#
# hyprlock can't play video and reloads images at most once a second, so the
# rest of the motion comes from labels re-running ./lain-lock.sh every
# 150-650 ms.
let
  assets = config.hyprlock.lainAssets;
  # The typing log, status, tagline and laugh run on the primary display
  # only; the rest is mirrored on every display.
  primary = config.hyprland.monitors.primary;

  frame = pkgs.writeShellScript "lain-lock" (''
    export PATH=${lib.makeBinPath (with pkgs; [ coreutils gawk gnused procps ])}:$PATH
  '' + builtins.readFile ./lain-lock.sh);
  cmd = ms: mode: "cmd[update:${toString ms}] ${frame} ${mode} ${assets}";

  # Fallback: plain navy with a lighter centre, scanlines and noise.
  fallback = pkgs.runCommand "lain-lock-frames" { nativeBuildInputs = [ pkgs.imagemagick ]; } ''
    mkdir -p $out
    W=1920 H=1080
    magick -size ''${W}x''${H} radial-gradient:'#34448a'-'#1d2650' base.png
    magick -size 1x3 xc:none -fill 'rgba(0,0,0,0.30)' -draw 'point 0,2' \
      -write mpr:s +delete -size ''${W}x''${H} tile:mpr:s scan.png
    for i in 0 1 2; do
      magick base.png -seed $((i * 7 + 3)) -attenuate 0.18 +noise Gaussian \
        scan.png -composite -modulate $((96 + i * 3)) -quality 90 $out/frame$i.jpg
    done
  '';
  # Which frame to show this second; hyprlock cross-fades between them.
  shimmer = pkgs.writeShellScript "lain-lock-shimmer" ''
    printf -v s '%(%s)T' -1
    f="${assets}/frame$((s % 3)).jpg"
    [ -r "$f" ] || f="${fallback}/frame$((s % 3)).jpg"
    echo "$f"
  '';

  mono = "VT323";
  serif = "Liberation Serif";
  pale = "rgb(d8e0f2)";
  dim = "rgba(b8c8eacc)";
  cyan = "rgb(6fd0ff)";
  cyanDim = "rgba(6fd0ff8c)";
  red = "rgb(e0475a)";
  amber = "rgb(e0a458)";
  glow = {
    shadow_passes = 2;
    shadow_size = 7;
    shadow_color = "rgba(3aa6ff55)";
  };
  label = args: { monitor = ""; font_family = mono; } // args;
in
{
  packages = [ pkgs.vt323 pkgs.liberation_ttf ];

  settings = {
    general = {
      hide_cursor = true;
      ignore_empty_input = true;
    };

    animations = {
      enabled = true;
      bezier = "linear, 0, 0, 1, 1";
      animation = [
        "fadeIn, 1, 3, linear"
        "fadeOut, 1, 3, linear"
        "inputFieldDots, 1, 1, linear"
      ];
    };

    background = [{
      monitor = "";
      path = "${assets}/frame0.jpg";
      color = "rgb(2a3768)";
      reload_time = 1;
      reload_cmd = "${shimmer}";
      crossfade_time = 0.9;
    }];

    label = [
      # NAVI boot log, typed out at the top left each time the screen locks.
      (label {
        monitor = primary;
        text = cmd 150 "boot";
        color = dim;
        font_size = 22;
        halign = "left";
        valign = "top";
        position = "80, -80";
      })
      (label {
        monitor = primary;
        text = cmd 650 "wired";
        color = cyan;
        font_size = 24;
        text_align = "right";
        halign = "right";
        valign = "top";
        position = "-80, -80";
      } // glow)
      (label {
        monitor = primary;
        text = cmd 500 "laugh";
        color = cyanDim;
        font_size = 28;
        halign = "center";
        valign = "top";
        position = "0, -150";
      })

      # Only drawn when ./assets is missing; the show's frame has the logo.
      (label {
        text = cmd 2000 "fallback";
        color = pale;
        font_family = serif;
        font_size = 46;
        text_align = "center";
        halign = "center";
        valign = "center";
        position = "0, -10";
      } // glow)

      (label {
        text = cmd 200 "clock";
        color = pale;
        font_family = serif;
        font_size = 24;
        text_align = "left";
        halign = "left";
        valign = "bottom";
        position = "80, 70";
      } // glow)
      (label {
        monitor = primary;
        text = cmd 180 "tagline";
        color = pale;
        font_family = serif;
        font_size = 24;
        halign = "right";
        valign = "bottom";
        position = "-80, 70";
      } // glow)
    ];

    # Below "Produced By Tachibana Lab".
    input-field = [{
      monitor = "";
      size = "460, 52";
      rounding = 0;
      outline_thickness = 2;
      outer_color = "rgba(6fd0ffa0)";
      inner_color = "rgba(141c40c8)";
      font_color = pale;
      font_family = mono;
      dots_text_format = "*";
      dots_size = 0.45;
      dots_spacing = 0.15;
      dots_center = false;
      fade_on_empty = false;
      placeholder_text = ''<span foreground="##9fb0d8">login: ${config.home.username}  ·  password_</span>'';
      check_color = cyan;
      fail_color = red;
      fail_text = "ACCESS DENIED  [$ATTEMPTS]";
      capslock_color = amber;
      halign = "center";
      valign = "center";
      position = "0, -405";
    }];
  };
}
