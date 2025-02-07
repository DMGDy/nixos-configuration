{ pkgs,  ... }:

{
  stylix = 
  {
    enable = true;
    autoEnable = false;
    image = ../../assets/nix.png;
    imageScalingMode = "fill";

    polarity = "dark";

    cursor = {

      package = pkgs.whitesur-cursors;
      name = "WhiteSur-cursors";
      size = 32;

      # For Presentations
      #package = pkgs.google-cursor;
      #name = "GoogleDot-Red";
      #size = 36;
    };

    targets.hyprland = {
      enable = false;
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

    targets.tmux = {
      enable = true;
    };

    targets.dunst = {
      enable = true;
    };

     targets.zathura = {
      enable = true;
    };
    

  };
}
