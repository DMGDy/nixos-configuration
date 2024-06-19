{ config, pkgs, ... }:

{
  environment.systemPackages = [(
    pkgs.catppuccin-sddm.override {
      flavor = "latte";
      font = "Ubuntu Mono";
      fontSize = "14";
      background = "${/home/dylandy/Pictures/wps/nixos-anime2.png}";
      loginBackground = true;
    }
  )];

  services.displayManager.sddm = {
    wayland.enable = true;
    theme = "catppuccin-latte";
  };
}
