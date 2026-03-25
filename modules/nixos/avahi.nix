{ config, pkgs, ... }:

{
  services.avahi = {
    enable = true;
    nssmdns4 = true;
    nssmdns6 = true;
    wideArea = true;
    publish = {
      enable = true;
      hinfo = true;
      workstation = true;
      userServices = true;
      domain = true;
      addresses = true;
    };
    hostName = "epic-nixos";
    allowInterfaces = [
      "enp191s0"
      "enp196s0f0u2u1"
    ];
  };

  # Publish additional hostname alias "fileserver.local"
  systemd.services.avahi-publish-fileserver = {
    description = "Publish dylandyfs.local mDNS CNAME";
    after = [ "avahi-daemon.service" "network-online.target" ];
    requires = [ "avahi-daemon.service" ];
    wants = [ "network-online.target" ];
    wantedBy = [ "multi-user.target" ];
    path = [ pkgs.avahi pkgs.iproute2 pkgs.gnugrep ];
    script = ''
      IP=$(ip -4 addr show enp191s0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}')
      exec avahi-publish -a -R dylandyfs.local "$IP"
    '';
    serviceConfig = {
      Type = "simple";
      Restart = "on-failure";
      RestartSec = "5s";
    };
  };

  # Local resolution for the server itself (NSS files module)
  networking.hosts = {
    "158.100.89.109" = [ "dylandyfs.local" ];
  };
}
