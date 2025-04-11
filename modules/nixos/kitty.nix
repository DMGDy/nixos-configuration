b, pkgs, ... }:
{
  programs.kitty = {
    enable = true;

    settings = {
      font_family = "IosevkaTerm Nerd Font Mono";
      font_size   = "16.0";
      adjust_line_height   = "0";
      adjust_column_width  = "0";
      adjust_baseline      = "0";
      disable_ligatures    = "never";

      "map shift+ctrl+v" = "paste_from_clipboard";
      "map shift+ctrl+c" = "copy_to_clipboard";

      detect_urls = "yes";
      background_opacity = "0.5";

      "map ctrl+shift+plus"  = "change_font_size all +0.5";
      "map ctrl+shift+minus" = "change_font_size all -0.5";

      confirm_os_window_close = "0";
      enable_audio_bell       = "no";
    };
  };
}
