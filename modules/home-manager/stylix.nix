{ pkgs, config, ... }:

{
  stylix = 
  {
    enable = true;
    autoEnable = false;
    image = /home/dylandy/Pictures/wps/nix.png;
    imageScalingMode = "fit";
    polarity = "dark";

    cursor = {
#      name = "oreo-black-cursors";
      package = pkgs.apple-cursor;
      name = "macOS-BigSur";
      size = 28;
    };

    targets.hyprland = {
      enable = true;
    };

    targets.bat = {
      enable = true;
    };

    targets.firefox = {
      enable = true;
    };

    targets.kitty = {
      enable = true;
    };

    targets.yazi = {
      enable = true;
    };
    

    targets.gtk = {
      enable = true;
    };

    targets.nixvim = {
      enable = false;
    };

  };
}
