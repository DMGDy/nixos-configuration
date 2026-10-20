{ ... }:
{
  home.sessionVariables.TERMINAL = "kitty";

  programs.kitty = {
    enable = true;

    settings = {
      font_family = "IosevkaTerm NF";
      font_size = 16;
      background_opacity = "0.80";
      inactive_text_alpha = "1.0";
      hide_window_decorations = "yes";
      linux_display_server = "wayland";
      confirm_os_window_close = 0;
      enable_audio_bell = "no";

      # Autumn Light: warm whites with deep, saturated fall accents.
      background = "#fffaf7";
      foreground = "#38231e";
      cursor = "#8c1612";
      cursor_text_color = "#fffaf7";
      selection_background = "#e6bca9";
      selection_foreground = "#38231e";
      url_color = "#85200b";
      active_border_color = "#8c1612";
      inactive_border_color = "#ad7862";
      bell_border_color = "#703900";
      active_tab_background = "#e6bca9";
      active_tab_foreground = "#38231e";
      inactive_tab_background = "#f0e4dc";
      inactive_tab_foreground = "#543128";
      tab_bar_background = "#fffaf7";

      color0 = "#38231e";
      color1 = "#8c1612";
      color2 = "#36530a";
      color3 = "#703900";
      color4 = "#85200b";
      color5 = "#82133f";
      color6 = "#693e00";
      color7 = "#38231e";
      color8 = "#634034";
      color9 = "#881605";
      color10 = "#295000";
      color11 = "#733900";
      color12 = "#871c06";
      color13 = "#86113e";
      color14 = "#713f00";
      color15 = "#21130f";
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
