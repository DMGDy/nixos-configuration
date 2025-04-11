{ config, pkgs, lib, ... }:

{
  hardware.opengl = {
    enable = true;
    driSupport32Bit = true;
  };

  services.xserver.videoDrivers = [ "nvidia"  ];

  hardware.nvidia = {
    package = config.boot.kernelPackages.nvidiaPackages.stable;

    modesetting.enable = true;
  };
  
  boot.kernelParams = lib.mkMerge [
    [ "nvidia-drm.modeset=1"  ]
  ];

  boot.initrd.kernelModules = [ "nvidia" "nvidia_modeset" "nvidia_uvm" "nvidia_drm"  ];
}
