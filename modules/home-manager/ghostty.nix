{ ... }:
{
  programs.ghostty = {
    enable = true;
    installBatSyntax=true;
    installVimSyntax=true;
    settings = {
      background-opacity = 0.55;
      background-blur-radius = 20;
      unfocused-split-opacity = 0.9;
      confirm-close-surface = false;
      theme = "Iceberg Light";
      title = "ghostty";
      font-size = 16;
      font-family = "IosevkaTerm NF";
      window-decoration = false;
      keybind = [
        "ctrl+shift+plus=increase_font_size:1"
        "ctrl+shift+minus=decrease_font_size:1"
        "ctrl+shift+space=reset_font_size"
      ];
    };
  };
}
