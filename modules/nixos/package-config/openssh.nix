{ config, pkgs, ... }:

{
  services.openssh = {
      enable = true;
      settings.PasswordAuthentication = true;
      ports = [
        22
      ];
  };
}
