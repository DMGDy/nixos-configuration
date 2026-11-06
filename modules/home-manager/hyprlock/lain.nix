{ config, lib, pkgs }:

# "Copland OS" lock screen after Serial Experiments Lain: a dark CRT sky with
# telephone wires, a typed-out NAVI boot log, a glitching logo with a red
# ghost, a ticking PRESENT DAY / PRESENT TIME clock and the occasional laugh.
# hyprlock can't play video and reloads images at most once a second, so the
# motion comes from labels re-running ./lain-lock.sh every 100-300 ms; the
# background only cross-fades between noise frames for a CRT shimmer.
# Everything is drawn here; no artwork from the show is used.
let
  # The typing log, tagline, laugh and status run on the primary display
  # only; the rest is mirrored on every display.
  primary = config.hyprland.monitors.primary;

  frame = pkgs.writeShellScript "lain-lock" (''
    export PATH=${lib.makeBinPath (with pkgs; [ coreutils gawk gnused procps ])}:$PATH
  '' + builtins.readFile ./lain-lock.sh);
  cmd = ms: mode: "cmd[update:${toString ms}] ${frame} ${mode}";

  frames = pkgs.runCommand "lain-lock-frames" { nativeBuildInputs = [ pkgs.imagemagick ]; } ''
    mkdir -p $out
    W=1920 H=1080
    magick -size ''${W}x''${H} gradient:'#23262d'-'#070708' sky.png
    magick -size ''${W}x''${H} -define gradient:center=960,1120 \
      -define gradient:radii=1250,520 radial-gradient:'#6a0e13'-'#000000' glow.png
    magick sky.png glow.png -compose screen -composite base.png
    # Power lines and a pole, the show's recurring motif.
    magick base.png -stroke '#020203' -strokewidth 4 -fill none \
      -draw "path 'M -40,150 Q 700,330 1530,205'" \
      -draw "path 'M -40,190 Q 700,375 1530,242'" \
      -draw "path 'M -40,236 Q 700,425 1530,285'" \
      -strokewidth 3 \
      -draw "path 'M 1560,205 Q 1760,250 1980,236'" \
      -draw "path 'M 1560,242 Q 1760,288 1980,274'" \
      -draw "path 'M 1560,285 Q 1760,330 1980,318'" \
      -stroke none -fill '#020203' \
      -draw "rectangle 1536,90 1558,1080" -draw "rectangle 1462,196 1632,210" \
      -draw "rectangle 1482,234 1612,246" -draw "rectangle 1494,278 1600,288" \
      -draw "rectangle 1528,300 1566,330" wires.png
    magick -size 1x3 xc:none -fill 'rgba(0,0,0,0.38)' -draw 'point 0,2' \
      -write mpr:s +delete -size ''${W}x''${H} tile:mpr:s scan.png
    magick -size ''${W}x''${H} radial-gradient:'rgba(0,0,0,0)'-'rgba(0,0,0,0.7)' vig.png
    for i in 0 1 2; do
      magick wires.png -seed $((i * 7 + 3)) -attenuate 0.25 +noise Gaussian \
        scan.png -composite vig.png -composite -modulate $((96 + i * 3)) \
        -quality 90 $out/frame$i.jpg
    done
  '';
  # Which noise frame to show this second; hyprlock cross-fades between them.
  shimmer = pkgs.writeShellScript "lain-lock-shimmer" ''
    printf -v s '%(%s)T' -1
    echo "${frames}/frame$((s % 3)).jpg"
  '';

  font = "VT323";
  pale = "rgb(d9d3c3)";
  dim = "rgba(aab6a0cc)";
  red = "rgb(c8161d)";
  redDim = "rgba(c8161d8c)";
  amber = "rgb(e0a458)";
  glow = {
    shadow_passes = 2;
    shadow_size = 6;
    shadow_color = "rgba(c8161d40)";
  };
  label = args: { monitor = ""; font_family = font; } // args;
in
{
  packages = [ pkgs.vt323 ];

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
      path = "${frames}/frame0.jpg";
      color = "rgb(070708)";
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
        color = red;
        font_size = 24;
        text_align = "right";
        halign = "right";
        valign = "top";
        position = "-80, -80";
      })

      # Logo: a red ghost a few pixels off the white one, each glitching on
      # its own schedule.
      (label {
        text = cmd 170 "ghost";
        color = redDim;
        font_size = 140;
        halign = "center";
        valign = "center";
        position = "5, 171";
      })
      (label {
        text = cmd 120 "logo";
        color = pale;
        font_size = 140;
        halign = "center";
        valign = "center";
        position = "0, 175";
      } // glow)
      (label {
        text = cmd 300 "sub";
        color = red;
        font_size = 30;
        halign = "center";
        valign = "center";
        position = "0, 72";
      })
      (label {
        monitor = primary;
        text = cmd 500 "laugh";
        color = redDim;
        font_size = 28;
        halign = "center";
        valign = "center";
        position = "0, 320";
      })

      (label {
        text = cmd 1000 "login";
        color = pale;
        font_size = 30;
        halign = "center";
        valign = "center";
        position = "0, -30";
      })

      (label {
        text = cmd 200 "clock";
        color = pale;
        font_size = 26;
        text_align = "left";
        halign = "left";
        valign = "bottom";
        position = "80, 70";
      })
      (label {
        monitor = primary;
        text = cmd 180 "tagline";
        color = pale;
        font_size = 26;
        halign = "right";
        valign = "bottom";
        position = "-80, 70";
      } // glow)
    ];

    input-field = [{
      monitor = "";
      size = "460, 56";
      rounding = 0;
      outline_thickness = 2;
      outer_color = "rgba(d9d3c38c)";
      inner_color = "rgba(060608c0)";
      font_color = pale;
      font_family = font;
      dots_text_format = "*";
      dots_size = 0.45;
      dots_spacing = 0.15;
      dots_center = false;
      fade_on_empty = false;
      placeholder_text = ''<span foreground="##8a8a80">password_</span>'';
      check_color = pale;
      fail_color = red;
      fail_text = "ACCESS DENIED  [$ATTEMPTS]";
      capslock_color = amber;
      halign = "center";
      valign = "center";
      position = "0, -100";
    }];
  };
}
