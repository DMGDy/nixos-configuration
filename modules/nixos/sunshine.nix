{ config, pkgs, ... }:

{
  environment.systemPackages = with pkgs; [
    sunshine
  ];

  # Open firewall for local network
  networking.firewall = {
    allowedTCPPorts = [ 47984 47989 47990 48010 ];
    allowedUDPPorts = [ 47998 47999 48000 48010 ];
  };

  # Optional: enable avahi for auto-discovery
  services.avahi = {
    enable = true;
    nssmdns4 = true;
    publish = {
      enable = true;
      addresses = true;
      workstation = true;
    };
  };
}
