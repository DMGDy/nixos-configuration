{ config, pkgs, lib, ... }:

{
  hardware.graphics = {
    enable = true;
    enable32Bit = true;
  };
  

  services.xserver.videoDrivers = [ "nvidia"  ];

  hardware.nvidia = {
    open = false;
    package = config.boot.kernelPackages.nvidiaPackages.stable;

    modesetting.enable = true;
  };
  
  boot.kernelParams = lib.mkMerge [
    [ "nvidia-drm.modeset=1"  ]
  ];

  boot.initrd.kernelModules = [ "nvidia" "nvidia_modeset" "nvidia_uvm" "nvidia_drm"  ];
}
