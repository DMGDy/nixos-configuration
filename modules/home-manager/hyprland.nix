{ config, pkgs, lib, inputs, ... }:

{
  options = {
    hyprlandLayout = lib.mkOption {
      default = "master";
      description = ''
        hyprland window layout
      '';
    };
  };
}
