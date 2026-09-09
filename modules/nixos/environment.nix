{ pkgs, ... }:

{
  environment.variables = {
    PKG_CONFIG_PATH="${pkgs.openssl.dev}/lib/pkgconfig";
    PATH = "$PATH:$HOME/Scripts";

    # Project directory shortcuts, all located under $HOME
    QUICK = "$HOME/QUICK";
    GRIP = "$HOME/GRIP";
    ADT = "$HOME/ADT";
    GOP = "$HOME/GOP";
    TS = "$HOME/TS";
    RSW = "$HOME/RSW";
    OTHER = "$HOME/Other";
  };
}
