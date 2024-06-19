{ config, pkgs, ... }:

{
  services.openssh = {
      enable = true;
      PasswordAuthentication = true;
      ports = [
        22
      ];
  };
}
