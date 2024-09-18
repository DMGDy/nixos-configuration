{ pkgs, ... }:

{
  stylix = 
  {
    enable = true;
    autoEnable = false;
    image = /home/dylandy/Pictures/wps/nix.png;

    polarity = "dark";

    cursor = {
#      name = "oreo-black-cursors";
      package = pkgs.whitesur-cursors;
      name = "WhiteSur-cursors";
      size = 26;
    };

    targets.hyprland = {
      enable = true;
    };

    targets.tofi= {
      enable = false;
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
