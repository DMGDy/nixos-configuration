#Edit this configuration file to define what should be installed on
# your system. Help is available in the configuration.nix(5) man page, on
# https://search.nixos.org/options and in the NixOS manual (`nixos-help`).

{ config, lib, pkgs, inputs, ... }:

{
  imports =
    [ # Include the results of the hardware scan.
      ./hardware-configuration.nix
      inputs.home-manager.nixosModules.home-manager
      ../../modules/nixos/display-manager.nix
      ../../modules/nixos/package-config/openssh.nix
      ../../modules/nixos/packages2.nix
      ../../modules/nixos/fonts.nix
      ../../modules/nixos/environment.nix
      ../../modules/nixos/nginx.nix
      ../../modules/nixos/python.nix
      ../../modules/nixos/avahi.nix
    ];

  boot.loader = {
    efi = {
      canTouchEfiVariables = true;
    };
    systemd-boot.enable = true;
  };
  networking = {
    # DNS settings
    nameservers = [ "10.94.2.200" "10.86.2.200" ];
    
    # Static routes
    networkmanager.enable = true;  # If you're using NetworkManager
    
    # Static route configuration
    extraHosts = ''
      # Any host mappings you might need
    '';
    
    # Define the routes from the image
    staticRoutes = [
      { destination = "10.8.0.0"; netmask = "255.255.0.0"; gateway = "158.100.69.1"; }
      { destination = "10.10.30.21"; netmask = "255.255.255.255"; gateway = "158.100.69.1"; }
      { destination = "10.10.32.86"; netmask = "255.255.255.255"; gateway = "158.100.69.1"; }
      { destination = "10.59.0.0"; netmask = "255.255.0.0"; gateway = "158.100.69.1"; }
      { destination = "10.70.0.0"; netmask = "255.255.0.0"; gateway = "158.100.69.1"; }
      { destination = "10.86.2.200"; netmask = "255.255.255.255"; gateway = "158.100.69.1"; }
      { destination = "10.94.2.200"; netmask = "255.255.255.255"; gateway = "158.100.69.1"; }
      { destination = "10.122.0.0"; netmask = "255.255.0.0"; gateway = "158.100.69.1"; }
      { destination = "10.192.0.0"; netmask = "255.255.0.0"; gateway = "158.100.69.1"; }
      { destination = "10.194.0.0"; netmask = "255.255.0.0"; gateway = "158.100.69.1"; }
      { destination = "10.216.0.0"; netmask = "255.255.0.0"; gateway = "158.100.69.1"; }
      { destination = "158.100.0.0"; netmask = "255.255.0.0"; gateway = "158.100.69.1"; }
      { destination = "158.100.77.0"; netmask = "255.255.0.0"; gateway = "158.100.69.1"; }
      { destination = "159.99.0.0"; netmask = "255.255.0.0"; gateway = "158.100.69.1"; }
      { destination = "165.195.0.0"; netmask = "255.255.0.0"; gateway = "158.100.69.1"; }
      { destination = "172.26.0.0"; netmask = "255.255.0.0"; gateway = "158.100.69.1"; }
      { destination = "199.63.0.0"; netmask = "255.255.0.0"; gateway = "158.100.69.1"; }
      { destination = "158.100.69.1"; netmask = "255.255.255.255"; gateway = "158.100.69.1"; }
      { destination = "199.63.86.148"; netmask = "255.255.255.255"; gateway = "158.100.69.1"; }
    ];
  };

  services.gnome.gnome-keyring.enable = true;
  nix.settings.experimental-features = [ "nix-command" "flakes" ];

  networking.hostName = "ny80t7910"; # Define your hostname.
  # Pick only one of the below networking options.

  networking.networkmanager.enable = true;  # Easiest to use and most distros use this by default.

  # Set your time zone.
  time.timeZone = "America/New_York";

  # Enable CUPS to print documents.
  # services.printing.enable = true;
  # Enable touchpad support (enabled default in most desktopManager).

  services.blueman.enable = true;
  programs.zsh.enable = true;
  nixpkgs.config.allowUnfree = true;

  # Define a user account. Don't forget to set a password with ‘passwd’.
   users.users.dylandy= {
     shell = pkgs.zsh;
     isNormalUser = true;
     extraGroups = [ "wheel"
       "sudo" 
       "input" 
       "networkmanager" 
     ];
   };
   home-manager = {
     extraSpecialArgs = { inherit inputs; };
     users = {
       dylandy = import ./home.nix;
     };
   };

  # List packages installed in system profile. To search, run:
  # $ nix search wget
   environment.systemPackages = with pkgs; [
     vim # Do not forget to add an editor to edit configuration.nix! The Nano editor is also installed by default.
     wget
     neofetch
     git
     tree
   ];

  programs.hyprland = {
    enable = true;
    package = inputs.hyprland.packages."${pkgs.system}".hyprland;
    xwayland.enable = true;
  };

  security.rtkit.enable = true;
  services.pipewire = {
    enable = true;
    audio.enable = true;
    wireplumber.enable = true;
    alsa.enable = true;
    alsa.support32Bit = true;
    pulse.enable = true;
    jack.enable = true;
  };

  xdg.portal.enable = true;
  
  environment.sessionVariables = {
    WLR_NO_HARDWARE_CURSORS = "1";
    NIXOS_OZONE_WL = "1";
  };

  services.udev.enable =true;

  system.stateVersion = "24.05"; # Did you read the comment?

}

