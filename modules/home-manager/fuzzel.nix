{ ... }:

{
  programs.fuzzel = {
    enable = true;
    settings = {
      main = {
        namespace = "desktop-launcher";
        font = "IosevkaTermSlab NF:style=Medium:pixelsize=18";
        dpi-aware = "no";
        terminal = "kitty -e";
        icon-theme = "Papirus-Light";
        icons-enabled = true;
        list-executables-in-path = true;
        fields = "filename,name,generic,exec,keywords";
        match-mode = "fzf";
        match-counter = true;
        anchor = "center";
        width = 58;
        lines = 8;
        horizontal-pad = 24;
        vertical-pad = 18;
        inner-pad = 12;
        line-height = 28;
        prompt = ''"Search: "'';
        placeholder = "Apps and commands";
      };
      colors = {
        background = "fffaf7ff";
        text = "38231eff";
        prompt = "8c1612ff";
        placeholder = "634034ff";
        input = "38231eff";
        match = "8c1612ff";
        selection = "e6bca9ff";
        selection-text = "38231eff";
        selection-match = "8c1612ff";
        counter = "634034ff";
        border = "8c1612ff";
      };
      border = {
        width = 2;
        radius = 10;
        selection-radius = 4;
      };
    };
  };
}
