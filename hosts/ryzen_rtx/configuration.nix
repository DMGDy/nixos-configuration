#Edit this configuration file to define what should be installed on
# your system. Help is available in the configuration.nix(5) man page, on
# https://search.nixos.org/options and in the NixOS manual (`nixos-help`).

{ config, lib, pkgs, inputs, options, ... }:

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
      ../../modules/nixos/nvidia.nix
      ../../modules/nixos/steam.nix
      ../../modules/nixos/tailscale.nix
    ];

  # RTX 2070 Super (Turing) uses the stable driver, not legacy_470, with
  # NVIDIA's open kernel module (recommended for Turing and newer).
  hardware.nvidia.package = lib.mkForce config.boot.kernelPackages.nvidiaPackages.stable;
  hardware.nvidia.open = lib.mkForce true;
  boot.extraModprobeConfig = ''
    options nvidia NVreg_UsePageAttributeTable=1
  '';

  # Compressed RAM swap first, disk swapfile as a backstop. No writebackDevice:
  # the t7910 zvol doesn't exist here and systemd waited 90s for it at boot.
  zramSwap = {
    enable = true;
    memoryPercent = 50;
  };
  boot.kernel.sysctl."vm.swappiness" = 10;
  swapDevices = [ {
      device = "/swapfile";
      size = 64 * 1024;
    }
  ];
  programs.nix-ld = {
    enable = true;
    # Extra libraries for the prebuilt Herdr desktop app (~/.local/share/herdr-app).
    libraries = options.programs.nix-ld.libraries.default ++ (with pkgs; [
      libxcb
      libxkbcommon
      vulkan-loader
      wayland
      libGL
    ]);
  };

  programs.steam = {
    enable = true;
    remotePlay.openFirewall = true;
    dedicatedServer.openFirewall = true;
    localNetworkGameTransfers.openFirewall = true;
    extraCompatPackages = [ pkgs.proton-ge-bin ];
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
        # /boot is only 1GiB; each generation's kernel+initrd is ~30MB+.
        configurationLimit = 8;
      };
    };

    # Keep NVIDIA out of the initrd: its modules and GSP firmware add ~100MB
    # per generation on the 1GiB /boot. They load from the root fs instead.
    initrd.kernelModules = lib.mkForce [ "dm_mod" ];

    # amd_pstate needs CPPC enabled in the BIOS (AMD CBS); without it the
    # kernel falls back to acpi-cpufreq.
    kernelParams = [ "nvme_core.default_ps_max_latency_us=0" "nvidia-drm.fbdev=1" "amd_pstate=active" ];
    kernelPackages = pkgs.linuxPackages_6_18;
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
      dylandy = import ./home.nix { username = "dylandy"; };
    };
  };

# List packages installed in system profile. To search, run:
# $ nix search wget
  environment.systemPackages = with pkgs; [
    vim # Do not forget to add an editor to edit configuration.nix! The Nano editor is also installed by default.
      wget
      awww
      python314
      perf
      vscode
      jdk
      ant
      docker
      teleport
      android-tools
      pwvucontrol
      discord
      prismlauncher
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

  # The onboard ALCS1200A (Matisse HD Audio, 1022:1487) boots with its
  # hardware 'Master' muted at 0%. WirePlumber's Pro Audio profile never
  # touches the mixer (only Analog profiles do), so it stays silent until an
  # Analog profile is selected once. Unmute it at 0 dB whenever the card
  # appears; PipeWire's software volume handles the actual level.
  services.udev.extraRules = ''
    ACTION=="add", SUBSYSTEM=="sound", KERNEL=="controlC*", ATTRS{vendor}=="0x1022", ATTRS{device}=="0x1487", RUN+="${pkgs.alsa-utils}/bin/amixer -q -c %n sset Master 100%% unmute"
  '';


  xdg.portal.enable = true;

  environment.sessionVariables = {
    WLR_NO_HARDWARE_CURSORS = "1";
    NIXOS_OZONE_WL = "1";
  };

  services.udev.enable =true;

  networking.firewall.allowedTCPPorts = [ 25565 ];

  system.stateVersion = "24.05"; # Did you read the comment?

}

