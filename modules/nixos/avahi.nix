{ config, ... }:

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
    allowInterfaces = [
      "wlp170s0"
    ];
    hostName = "epic-nixos";
  };
}
