{ config, pkgs, ... }:

{
  services.displayManager.ly = {
    enable = true;
  };
#  services.displayManager.sddm = {
#    enable = true;
#    enableHidpi = true;
#    wayland.enable = true;
#    theme = "where_is_my_sddm_theme";
#    settings = {
#      Item = {
#        id = "cursor";
#        visible = "false";
#      };
#    };
#
#    autoLogin.relogin = true;
#  };

}

