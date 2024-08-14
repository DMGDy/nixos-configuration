{ pkgs, ... }:

{
  virtualisation.virtualbox = {
    host = {
      enable = true;
      enableExtensionPack = true;
    };
    guest = {
      enable = true;
      clipboard= true;
    };
  };
}
