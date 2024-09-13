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
      name = "GoogleDot-Red";
      package = pkgs.google-cursor;
      size = 32;
    };

    targets.hyprland = {
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
