{ pkgs, ... }:

{
  environment.variables = {
    PKG_CONFIG_PATH="${pkgs.openssl.dev}/lib/pkgconfig";
    PATH = "$PATH:$HOME/Scripts";
  };
}
