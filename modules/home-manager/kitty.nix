{ ... }:
{
  home.sessionVariables.TERMINAL = "kitty";

  programs.kitty = {
    enable = true;

    settings = {
      font_family = "IosevkaTerm NF";
      font_size = 16;
      background_opacity = "0.55";
      inactive_text_alpha = "0.9";
      hide_window_decorations = "yes";
      linux_display_server = "wayland";
      confirm_os_window_close = 0;
      enable_audio_bell = "no";

      # Ghostty's Iceberg Light palette, rather than Stylix's Base16 mapping.
      background = "#e8e9ec";
      foreground = "#33374c";
      cursor = "#33374c";
      cursor_text_color = "#e8e9ec";
      selection_background = "#33374c";
      selection_foreground = "#e8e9ec";
      color0 = "#dcdfe7";
      color1 = "#cc517a";
      color2 = "#668e3d";
      color3 = "#c57339";
      color4 = "#2d539e";
      color5 = "#7759b4";
      color6 = "#3f83a6";
      color7 = "#33374c";
      color8 = "#8389a3";
      color9 = "#cc3768";
      color10 = "#598030";
      color11 = "#b6662d";
      color12 = "#22478e";
      color13 = "#6845ad";
      color14 = "#327698";
      color15 = "#262a3f";
    };

    keybindings = {
      "ctrl+shift+c" = "copy_to_clipboard";
      "ctrl+shift+v" = "paste_from_clipboard";
      "ctrl+shift+plus" = "change_font_size all +1";
      "ctrl+shift+minus" = "change_font_size all -1";
      "ctrl+shift+space" = "change_font_size all 0";
    };
  };
}
