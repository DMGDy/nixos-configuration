{config, lib, pkgs, ... }:
{
  programs.kitty = {
    enable = true;

    settings = {
      font_family = lib.mkDefault "IosevkaTerm Nerd Font Mono";
      font_size   = lib.mkDefault "16.0";
      adjust_line_height   = lib.mkDefault "0";
      adjust_column_width  = lib.mkDefault  "0";
      adjust_baseline      = lib.mkDefault  "0";
      disable_ligatures    = lib.mkDefault  "never";

      "map shift+ctrl+v" = lib.mkDefault "paste_from_clipboard";
      "map shift+ctrl+c" = "copy_to_clipboard";

      detect_urls = "yes";
      background_opacity = lib.mkDefault "0.5";

      "map ctrl+shift+plus"  = "change_font_size all +0.5";
      "map ctrl+shift+minus" = "change_font_size all -0.5";

      confirm_os_window_close = "0";
      enable_audio_bell       = "no";
    };
  };
}
