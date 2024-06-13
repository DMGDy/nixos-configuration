{ lib, config, pkgs, ... }:

let
  cfg = config.main-user;
in
{
  options.main-user = {
    enable - lib.mkEnableOption "enable user module";

    userName = lib.mkOption {
      default = "user"
      description = ''
        username
      '';
    };
  };
  config = lib.mkIf cfg.enable {
    user.users.${cfg.userName} = {
      isNormalUser = true;
      description = "main user";
      shell = pkgs.zsh;
    };
  };
}
