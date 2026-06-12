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
      ../../modules/nixos/common-packages.nix
      ../../modules/nixos/fonts.nix
      ../../modules/nixos/environment.nix
      ../../modules/nixos/python.nix
      ../../modules/nixos/docker.nix
      ../../modules/nixos/nginx.nix
    ];
  swapDevices = [ {
      device = "/swapfile";
      size = 64 * 1024;
    }
    {
      device = "/swapfile2";
      size = 128 * 1024;
    }
  ];
  zramSwap= {
    enable = true;
    memoryMax = 65536;
    memoryPercent = 50;
    writebackDevice = "/dev/zvol/tank/swap";
  };

  programs.nix-ld.enable = true;

  programs.steam = {
    enable = true;
    remotePlay.openFirewall = true;
    dedicatedServer.openFirewall = true;
    localNetworkGameTransfers.openFirewall = true;
  };



  hardware.bluetooth = {
    enable = true;
    powerOnBoot = true;
  };

  boot = {
    loader = {
      efi = {
        canTouchEfiVariables = true;
        efiSysMountPoint = "/boot/";
      };
      grub = {
        enable = true;
        efiSupport = true;
        device = "nodev";
      };
    };

    kernelParams = [ "nvme_core.default_ps_max_latency_us=0" ];
    kernelPackages = pkgs.linuxPackages_6_12;
  };


  services.gnome.gnome-keyring.enable = true;
  nix.settings.experimental-features = [ "nix-command" "flakes" ];

  networking.hostName = "nixos-gaming"; # Define your hostname.
# Pick only one of the below networking options.


# Set your time zone.
    time.timeZone = "America/New_York";

# Enable CUPS to print documents.
# services.printing.enable = true;
# Enable touchpad support (enabled default in most desktopManager).

  services.blueman.enable = true;
  programs.zsh.enable = true;
  nixpkgs.config = {
    allowUnfree = true;
    nvidia.acceptLicense = true;
  };

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
      swww
      python314
      linuxKernel.packages.linux_6_6.perf
      vscode
      jdk
      ant
      docker
      teleport
      android-tools
      pwvucontrol
      discord
  ];

  programs.hyprland = {
    enable = true;
    package = inputs.hyprland.packages."${pkgs.stdenv.hostPlatform.system}".hyprland;
    xwayland.enable = true;
  };

  security.rtkit.enable = true;
  
  services.pipewire = {
    enable = true;
    alsa = {
      enable = true;
      support32Bit = true;
    };
    pulse.enable = true;
    jack.enable = true;
    wireplumber.enable = true;
  };


  xdg.portal.enable = true;

  environment.sessionVariables = {
    WLR_NO_HARDWARE_CURSORS = "1";
    NIXOS_OZONE_WL = "1";
  };

  services.udev.enable =true;

  system.stateVersion = "24.05"; # Did you read the comment?

}

