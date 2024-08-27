{ pkgs, ... }:

{
  virtualisation.virtualbox = {
    host = {
      enable = true;
      enableExtensionPack = true;
    };
    guest = {
      clipboard= true;
    };
  };
}
