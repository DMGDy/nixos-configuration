{ config, pkgs, ... }:

{
 services.xserver.enable = true;
 services.xserver.displayManager.defaultSession = "none+Hyprland";
 xdg.portal = {
   enable = true;
   wlr.enable = true;
   extraPortals = [ pkgs.xdg-desktop-portal-gtk ];
 };
}
