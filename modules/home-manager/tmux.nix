{ config, pkgs, ... }:

let
  colors = config.programs.kitty.settings;
in
{
  programs.tmux = {
    enable = true;
    aggressiveResize = true;
    clock24 = true;
    keyMode = "vi";
    shortcut = "a";
    terminal = "screen-256color";
    resizeAmount = 1;
    baseIndex = 1;

    extraConfig = "
      set -g allow-passthrough on

      set -g @plugin 'tmux-plugins/tmux-resurrect'
      set -g @plugin 'omerxx/tmux-floax'
      set -g @plugin 'tmux-plugins/tmux-yank'
      set -g @plugin 'tmux-plugins/tmux-sidebar'
      set -g @plugin 'rose-pine/tmux'
      set -g @plugin 'laktak/extrakto'
      set -g @resurrect-capture-pane-contents 'on'
      set -g @resurrect-strategy-nvim 'session'

      # tmux-floax creates a hardcoded 'scratch' session that resurrect then
      # persists and restores, interfering with other sessions. Unbind its
      # trigger keys (prefix p / P) so it is not spawned, and kill any leftover
      # 'scratch' session whenever a client attaches so restores cannot revive it.
      unbind p
      unbind P
      set-hook -g client-attached 'run-shell \"tmux kill-session -t scratch 2>/dev/null || true\"'

      unbind-key -T copy-mode-vi MouseDragEnd1Pane
      set -g status-position bottom
      set -g status-justify left
      set -g status-left ''
      set -g status-interval 5
      set -g status-right-length 70
      set -g status-style 'fg=${colors.foreground},bg=default'
      set -g status-right '#[bg=default,nobold,nounderscore,fg=${colors.color8}]#{=24:#{b:pane_current_path}}  #[fg=${colors.foreground}]#H#{?client_prefix,  #[fg=${colors.color1}]PREFIX,}#{?window_zoomed_flag,  #[fg=${colors.color1}]ZOOM,} '

      setw -g window-status-separator '  '
      setw -g window-status-style 'fg=${colors.color8},bg=default,nobold,nounderscore,nodim'
      setw -g window-status-current-style 'fg=${colors.color1},bg=${colors.selection_background},bold,underscore,nodim'
      setw -g window-status-format ' #I:#W#{?window_activity_flag, +,}#{?window_bell_flag, !,}#{?window_zoomed_flag, Z,} '
      setw -g window-status-current-format ' #I:#W#{?window_zoomed_flag, Z,} '
      setw -g window-status-activity-style 'fg=${colors.color3},bg=default,bold'
      setw -g window-status-bell-style 'fg=${colors.color1},bg=${colors.selection_background},bold'

      set -g pane-border-style 'fg=${colors.inactive_border_color}'
      set -g pane-active-border-style 'fg=${colors.active_border_color}'
      set -g message-style 'fg=${colors.foreground},bg=${colors.inactive_tab_background}'
      set -g message-command-style 'fg=${colors.foreground},bg=${colors.inactive_tab_background}'
      setw -g mode-style 'fg=${colors.selection_foreground},bg=${colors.selection_background}'
      set -g display-panes-colour '${colors.color8}'
      set -g display-panes-active-colour '${colors.color1}'

      set -g  mouse on

      # C-s to switch sessions 
      bind -n C-s switch-client -l

      # start windows and panes at 1, not 0 set -g base-index 1
      setw -g pane-base-index 1

      bind-key C-a last-window

      # unbind arrow keys and pane switching keys
      unbind Up     
      unbind Down   
      unbind Left   
      unbind Right  

      unbind C-Up   
      unbind C-Down 
      unbind C-Left 
      unbind C-Right

      # bind vim keys to moving around without prefix of a simply ctrl+<key>
      bind -n C-k select-pane -U 
      bind -n C-j select-pane -D 
      bind -n C-h select-pane -L 
      bind -n C-l select-pane -R

      # vim-like pane resizing  
      bind -r C-k resize-pane -U
      bind -r C-j resize-pane -D
      bind -r C-h resize-pane -L
      bind -r C-l resize-pane -R     

      set -g history-limit 131072

      ";
      plugins = with pkgs.tmuxPlugins; [
        resurrect
        tmux-floax
        yank
        sidebar
        extrakto
     #{

     # plugin = rose-pine;
     # extraConfig = ''
     #   set -g @rose_pine_variant 'main'
     #   set -g @rose_pine_host 'on' # Enables hostname in the status bar
     #   set -g @rose_pine_date_time '%d-%m-%Y %H:%M' # It accepts the date UNIX command format (man date for info)
     #   set -g @rose_pine_user 'on' # Turn on the username component in the statusbar
     #   set -g @rose_pine_directory 'on' # Turn on the current folder component in the status bar
     #   set -g @rose_pine_bar_bg_disabled_color_option 'default'

     #   set -g @rose_pine_default_window_behavior 'on' # Forces tmux default window list behaviour
     #   set -g @rose_pine_show_current_program 'on' # Forces tmux to show the current running program as window name
     #   set -g @rose_pine_show_pane_directory 'on' # Forces tmux to show the current directory as window name

     #   set -g @rose_pine_session_icon '' # Changes the default icon to the left of the session name
     #   set -g @rose_pine_current_window_icon '' # Changes the default icon to the left of the active window name
     #   set -g @rose_pine_folder_icon '' # Changes the default icon to the left of the current directory folder
     #   set -g @rose_pine_username_icon '' # Changes the default icon to the right of the hostname
     #   set -g @rose_pine_hostname_icon '󰒋' # Changes the default icon to the right of the hostname
     #   set -g @rose_pine_date_time_icon '󰃰' # Changes the default icon to the right of the date module
     #   set -g @rose_pine_window_status_separator "  " # Changes the default icon that appears between window namesk
     # '';
     #}
   ];
 };
}
