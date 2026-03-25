{ pkgs, ... }:

{
  stylix = {
    enable = true;
    autoEnable = false;
    image = ../../assets/nix.png;
    imageScalingMode = "fill";

    polarity = "light";

    # Iceberg Light color palette
    base16Scheme = {
      base00 = "e8e9ec"; # background
      base01 = "dcdfe7"; # lighter background
      base02 = "c6c8d1"; # selection
      base03 = "6b7089"; # comments
      base04 = "33374c"; # dark foreground
      base05 = "33374c"; # foreground
      base06 = "1e2132"; # light foreground
      base07 = "17171b"; # lightest foreground
      base08 = "cc517a"; # red
      base09 = "c57339"; # orange
      base0A = "c18401"; # yellow
      base0B = "668e3d"; # green
      base0C = "3f83a6"; # cyan
      base0D = "2d539e"; # blue
      base0E = "7759b4"; # purple
      base0F = "cc3768"; # magenta
    };

    cursor = {
      package = pkgs.whitesur-cursors;
      name = "WhiteSur-cursors";
      size = 32;
    };

    targets.hyprland.enable = false;
    targets.tofi.enable = false;
    targets.bat.enable = true;
    targets.firefox.enable = true;
    targets.kitty.enable = true;
    targets.yazi.enable = true;
    targets.gtk.enable = true;
    targets.nixvim.enable = false;
    targets.tmux.enable = false;
    targets.dunst.enable = true;
    targets.zathura.enable = true;
  };

  # GTK icon theme (Stylix handles the color theme)
  gtk = {
    enable = true;
    iconTheme = {
      package = pkgs.papirus-icon-theme;
      name = "Papirus-Light";
    };
    gtk3.extraConfig = {
      gtk-application-prefer-dark-theme = false;
    };
    gtk4.extraConfig = {
      gtk-application-prefer-dark-theme = false;
    };
  };

  # Dunst notification styling (colors handled by Stylix)
  services.dunst = {
    enable = true;
    settings = {
      global = {
        width = 350;
        height = 150;
        offset = "20x50";
        origin = "top-right";
        monitor = "DP-4";
        follow = "none";
        transparency = 15;
        frame_width = 2;
        corner_radius = 10;
        padding = 15;
        horizontal_padding = 15;
        icon_position = "left";
        max_icon_size = 64;
      };
      urgency_low = {
        timeout = 5;
      };
      urgency_normal = {
        timeout = 10;
      };
      urgency_critical = {
        timeout = 0;
      };
    };
  };
}
