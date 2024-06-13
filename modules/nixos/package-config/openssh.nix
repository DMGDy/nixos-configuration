{ config, pkgs, ... }:

{
  services.openssh = {
      enable = true;
      passwordAuthentication = true;
      ports = [
        22
      ];
  };
}
