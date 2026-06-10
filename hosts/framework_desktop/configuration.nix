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
    # Use systemd-resolved for split DNS: route queries for the corporate
    # search domains (ds.resideo.com, resideo.com) to corporate DNS, and let
    # everything else (public Internet) use the DNS servers handed out by the
    # other connection (e.g. the USB dock's 8.8.8.8/1.1.1.1). NetworkManager
    # forwards each connection's DNS + search domains to systemd-resolved,
    # which dispatches per-domain. This avoids the flat-resolv.conf trap
    # where the first NS to return NXDOMAIN ends resolution.
    networkmanager.dns = "systemd-resolved";
    nameservers = [ "10.94.2.200" "10.86.2.200" ];

    interfaces.enp196s0f0u2u1.ipv4.routes = [
      {
        address      = "0.0.0.0";
        prefixLength = 0;
        via          = "10.10.100.1";
        options.metric = "10";
      }
    ];

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
      {
        address      = "158.100.69.0";
        prefixLength = 24;
        via          = "158.100.89.254";
      }
      {
        address      = "158.100.89.38";
        prefixLength = 32;
        via          = "158.100.89.254";
      }
      {
        address      = "158.100.90.0";
        prefixLength = 24;
        via          = "158.100.89.254";
      }
      {
        address      = "172.31.0.0";
        prefixLength = 16;
        via          = "158.100.89.254";
      }

    ];
  };

  security.pam.loginLimits = [
    { domain = "*"; item = "nofile"; type = "-"; value = "65536"; }
  ];

  services.gnome.gnome-keyring.enable = true;
  nix.settings.experimental-features = [ "nix-command" "flakes" ];

  # systemd-resolved provides split DNS. NetworkManager (with
  # networkmanager.dns = "systemd-resolved" above) hands each connection's
  # DNS + search domains to resolved, which then dispatches queries
  # per-domain (corporate domains -> corporate DNS, everything else ->
  # the dock's public DNS). `domains = [ "~." ]` on the corporate NIC
  # would be too aggressive; we only want the corporate suffixes to be
  # routing domains. The connection's DHCP-provided search domains
  # (ds.resideo.com, resideo.com) are already used as routing domains by
  # resolved when they come from NM, so no further config is needed for
  # the common case.
  services.resolved = {
    enable = true;
    # Use the corporate DNS as a global fallback if a query matches no
    # routing-domain rule and no other connection provides DNS. Harmless
    # alongside per-link DNS from NM.
    settings.Resolve.FallbackDNS = [ "10.94.2.200" "10.86.2.200" ];
    # Keep DNSSEC off; corporate networks often break it.
    settings.Resolve.DNSSEC = "false";
  };

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
  package = inputs.hyprland.packages."${pkgs.stdenv.hostPlatform.system}".hyprland;
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

