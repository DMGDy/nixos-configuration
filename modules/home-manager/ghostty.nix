{ ... }:
{
  programs.ghostty = {
    enable = true;
    installBatSyntax=true;
    installVimSyntax=true;
    settings = {
      background-opacity=0.75;
      background-blur=true;
      confirm-close-surface=false;
      theme="Dark Pastel";
      title="ghostty";
      font-size=16;
      font-family="Cascadia Mono Regular";
      keybind = [
        "ctrl+shift+plus=increase_font_size:1"
        "ctrl+shift+minus=decrease_font_size:1"
        "ctrl+shift+space=reset_font_size"
      ];
    };
  };
}
