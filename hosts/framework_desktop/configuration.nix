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
    ./packages.nix
    ../../modules/nixos/fonts.nix
    ../../modules/nixos/environment.nix
    ../../modules/nixos/python.nix
    ../../modules/nixos/docker.nix
    ../../modules/nixos/nginx.nix
    ../../modules/nixos/sunshine.nix
    ../../modules/nixos/avahi.nix
    ../../modules/nixos/ollama.nix
  ];

  systemd.tmpfiles.rules = 
  let
    rocmEnv = pkgs.symlinkJoin {
      name = "rocm-combined";
      paths = with pkgs.rocmPackages; [
        rocblas
        hipblas
        clr
      ];
    };
  in [
    "L+    /opt/rocm   -    -    -     -    ${rocmEnv}"
  ];

  fileSystems."/mnt/shared" = {
    device = "10.10.101.31:/srv/nfs/shared";
    fsType = "nfs";
    options = [ "x-systemd.automount" "noauto" ];
  };

  programs.nix-ld.enable = true;

  hardware.bluetooth = {
    enable = true;
    powerOnBoot = true;
  };
  hardware.graphics = {
    enable = true;
    enable32Bit = true;
  };

  hardware.graphics.extraPackages = with pkgs; [
    rocmPackages.clr.icd
  ];
  hardware.amdgpu = {
    initrd.enable = true;
    opencl.enable = true;
  };

  boot.kernelPackages = pkgs.linuxPackages_6_18;

  boot.loader = {
    efi = {
      canTouchEfiVariables = true;
    };
    systemd-boot.enable = true;
  };
  networking = {
    networkmanager.enable = true;  
    nameservers = [ "10.94.2.200" "10.86.2.200" ];

    interfaces.enp191s0.ipv4.routes = [
      {
        address      = "10.8.0.0";
        prefixLength = 16;
        via          = "158.100.89.254";
      }
      {
        address      = "10.10.30.21";
        prefixLength = 32;
        via          = "158.100.89.254";
      }
      {
        address      = "10.10.32.86";
        prefixLength = 32;
        via          = "158.100.89.254";
      }
      {
        address      = "10.59.0.0";
        prefixLength = 16;
        via          = "158.100.89.254";
      }
      {
        address      = "10.70.0.0";
        prefixLength = 16;
        via          = "158.100.89.254";
      }
      {
        address      = "10.86.2.200";
        prefixLength = 32;
        via          = "158.100.89.254";
      }
      {
        address      = "10.94.2.200";
        prefixLength = 32;
        via          = "158.100.89.254";
      }
      {
        address      = "10.122.20.0";
        prefixLength = 24;
        via          = "158.100.89.254";
      }
      {
        address      = "10.192.0.0";
        prefixLength = 16;
        via          = "158.100.89.254";
      }
      {
        address      = "10.194.0.0";
        prefixLength = 16;
        via          = "158.100.89.254";
      }
      {
        address      = "10.216.0.0";
        prefixLength = 16;
        via          = "158.100.89.254";
      }
      {
        address      = "158.100.0.0";
        prefixLength = 32;
        via          = "158.100.89.254";
      }
      {
        address      = "158.100.67.0";
        prefixLength = 24;
        via          = "158.100.89.254";
      }
      {
        address      = "158.100.67.1";
        prefixLength = 32;
        via          = "158.100.89.254";
      }
      {
        address      = "158.100.77.0";
        prefixLength = 26;
        via          = "158.100.89.254";
      }
      {
        address      = "159.99.0.0";
        prefixLength = 16;
        via          = "158.100.89.254";
      }
      {
        address      = "165.195.0.0";
        prefixLength = 26;
        via          = "158.100.89.254";
      }
      {
        address      = "172.26.0.0";
        prefixLength = 16;
        via          = "158.100.89.254";
      }
      {
        address      = "199.63.0.0";
        prefixLength = 16;
        via          = "158.100.89.254";
      }
      {
        address      = "158.100.89.254";
        prefixLength = 32;
        via          = "158.100.89.254";
      }
      {
        address      = "199.63.86.148";
        prefixLength = 32;
        via          = "158.100.89.254";
      }

    ];
  };

  security.pam.loginLimits = [
    { domain = "*"; item = "nofile"; type = "-"; value = "65536"; }
  ];

  services.gnome.gnome-keyring.enable = true;
  nix.settings.experimental-features = [ "nix-command" "flakes" ];

  networking.hostName = "framework-amd-ai395"; 

# Set your time zone.
time.timeZone = "America/New_York";

# Enable CUPS to print documents.
# services.printing.enable = true;
# Enable touchpad support (enabled default in most desktopManager).

services.blueman.enable = true;
programs.zsh.enable = true;
nixpkgs = {
  config = {
    allowUnfree = true;
    nvidia.acceptLicense = true;
    permittedInsecurePackages = ["gradle-7.6.6"];
  };
};

# Define a user account. Don't forget to set a password with ‘passwd’.
users.users.dylandy= {
  shell = pkgs.zsh;
  isNormalUser = true;
  extraGroups = [ "wheel"
  "sudo"
  "input"
  "networkmanager"
  "video"
  "render"
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

