{ config, pkgs, ... }:

let
  darkTheme = config.stylix.polarity == "dark";
in
{
  stylix = {
    enable = true;
    autoEnable = false;
    image = ../../assets/nix.png;
    imageScalingMode = "fill";

    polarity = "dark";

    # Iceberg Dark color palette
    base16Scheme = {
      base00 = "161821"; # background
      base01 = "1e2132"; # lighter background
      base02 = "2a2f47"; # selection
      base03 = "6b7089"; # comments
      base04 = "818596"; # dark foreground
      base05 = "c6c8d1"; # foreground
      base06 = "cdd1e6"; # light foreground
      base07 = "e8e9ec"; # lightest foreground
      base08 = "e27878"; # red
      base09 = "e2a478"; # orange
      base0A = "e2d478"; # yellow
      base0B = "b4be82"; # green
      base0C = "89b8c2"; # cyan
      base0D = "84a0c6"; # blue
      base0E = "a093c7"; # purple
      base0F = "e98989"; # magenta
    };

    cursor = {
      package = pkgs.whitesur-cursors;
      name = "WhiteSur-cursors";
      size = 32;
    };

    targets.hyprland.enable = false;
    targets.fuzzel.enable = false;
    targets.bat.enable = true;
    targets.firefox.enable = true;
    targets.kitty.enable = false;
    targets.yazi.enable = true;
    targets.gtk.enable = true;
    targets.nixvim.enable = false;
    targets.tmux.enable = false;
    targets.dunst.enable = false;
    targets.zathura.enable = true;
  };

  # GTK icon theme (Stylix handles the color theme)
  gtk = {
    enable = true;
    iconTheme = {
      package = pkgs.papirus-icon-theme;
      name = if darkTheme then "Papirus-Dark" else "Papirus-Light";
    };
    gtk3.extraConfig = {
      gtk-application-prefer-dark-theme = darkTheme;
    };
    gtk4.extraConfig = {
      gtk-application-prefer-dark-theme = darkTheme;
    };
  };

  # Explicit Autumn colors keep notifications aligned with Kitty and Epic Bar.
  services.dunst = {
    enable = true;
    iconTheme = {
      package = pkgs.papirus-icon-theme;
      name = "Papirus-Light";
    };
    settings = {
      global = {
        font = "Segoe UI Variable, Segoe UI, sans-serif 12";
        width = 350;
        height = 150;
        offset = "20x50";
        origin = "top-right";
        monitor = "DP-4";
        follow = "none";
        transparency = 0;
        frame_width = 2;
        corner_radius = 10;
        padding = 15;
        horizontal_padding = 15;
        icon_position = "left";
        max_icon_size = 64;
        separator_color = "#d9c5b9";
      };
      urgency_low = {
        background = "#fffaf7";
        foreground = "#634034";
        frame_color = "#d9c5b9";
        highlight = "#634034";
        timeout = 5;
      };
      urgency_normal = {
        background = "#fffaf7";
        foreground = "#38231e";
        frame_color = "#c57339";
        highlight = "#8c1612";
        timeout = 10;
      };
      urgency_critical = {
        background = "#f4d3c7";
        foreground = "#38231e";
        frame_color = "#dc2626";
        highlight = "#dc2626";
        timeout = 0;
      };
    };
  };
}
