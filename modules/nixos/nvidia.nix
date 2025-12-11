{ config, pkgs, lib, ... }:

{
  hardware.graphics = {
    enable = true;
    enable32Bit = true;

    extraPackages = with pkgs; [
      intel-media-driver
      intel-vaapi-driver
      libva-vdpau-driver
      libvdpau
    ];
  };
  
  services.xserver.videoDrivers = [ "nvidia"  ];

  hardware.nvidia = {
    open = false;
    package = config.boot.kernelPackages.nvidiaPackages.legacy_470;

    modesetting.enable = true;
    powerManagement.enable = false;
    powerManagement.finegrained = false;
  };
  
  boot.kernelParams = lib.mkMerge [
    [ "nvidia-drm.modeset=1"  ]
  ];

  boot.initrd.kernelModules = [ "nvidia" "nvidia_modeset" "nvidia_uvm" "nvidia_drm"  ];
  environment.sessionVariables= {
    GBM_BACKEND= "nvidia-drm";
    __GLX_VENDOR_LIBRARY_NAME = "nvidia";
    WLR_NO_HARDWARE_CURSORS = "1";

    __NV_PRIME_RENDER_OFFLOAD = "0";
    LIBVA_DRIVER_NAME = "nvidia";
  };
}
