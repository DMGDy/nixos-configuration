{ config, lib, ...}:

let
  sysconfig = (import <nixpkgs/nixos> {}).config;
in
{
  sysconfig.environment.variables.EWW_CSS = 
    let configFile = config.lib.stylix.colors {
      template = ./eww_colors.scss.mustache;
      extension = ".scss";
      };
    in "${configFile}";
}
