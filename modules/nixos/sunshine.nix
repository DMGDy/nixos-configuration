{ config, pkgs, ... }:

{
  environment.systemPackages = with pkgs; [
    sunshine
  ];

  security.wrappers.sunshine = {
    owner = "root";
    group = "root";
    capabilities = "cap_sys_admin+p";
    source = "${pkgs.sunshine}/bin/sunshine";
  };

  # Open firewall for local network
  networking.firewall = {
    allowedTCPPorts = [ 47984 47989 47990 48010 ];
    allowedUDPPorts = [ 47998 47999 48000 48010 ];
  };

    # Create sunshine config directory and file
  environment.etc."sunshine/sunshine.conf".text = ''
    sunshine_name = nixos-desktop
    min_log_level = info
    
    # Set credentials (change these!)
    username = dylxndy 
    password = 8a3b991a
    
    # Network settings
    port = 47989
    upnp = disabled
    
    # Encoder settings (adjust for your GPU)
    #encoder = software
    
    # Resolution/FPS defaults
    fps = [10, 30, 60, 90, 120]
    resolutions = [
      352x240
      480x360
      858x480
      1280x720
      1920x1080
      2560x1440
      3840x2160
    ]
  ''; 

  services.avahi = {
    enable = true;
    nssmdns4 = true;
    nssmdns6 = true;
    publish = {
      enable = true;
      addresses = true;
      workstation = true;
      userServices = true;  # Important!
    };
  };

  users.users.dylandy.extraGroups = [ "avahi" "input"];
}
