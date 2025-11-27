{ pkgs, ... }:

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
      set -g @plugin 'tmux-plugins/tmux-resurrect'
      set -g @plugin 'omerxx/tmux-floax'
      set -g @plugin 'tmux-plugins/tmux-yank'
      set -g @plugin 'tmux-plugins/tmux-sidebar'
      set -g @plugin 'rose-pine/tmux'
      set -g @plugin 'laktak/extrakto'
      set -g @resurrect-capture-pane-contents 'on'
      set -g @resurrect-strategy-nvim 'session'

      set -g status-position bottom
      set -g status-justify left
      set -g status-left ''
      set -g status-right

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
     {

      plugin = rose-pine;
      extraConfig = ''
        set -g @rose_pine_variant 'main'
        set -g @rose_pine_host 'on' # Enables hostname in the status bar
        set -g @rose_pine_date_time '%d-%m-%Y %H:%M' # It accepts the date UNIX command format (man date for info)
        set -g @rose_pine_user 'on' # Turn on the username component in the statusbar
        set -g @rose_pine_directory 'on' # Turn on the current folder component in the status bar
        set -g @rose_pine_bar_bg_disabled_color_option 'default'

        set -g @rose_pine_default_window_behavior 'on' # Forces tmux default window list behaviour
        set -g @rose_pine_show_current_program 'on' # Forces tmux to show the current running program as window name
        set -g @rose_pine_show_pane_directory 'on' # Forces tmux to show the current directory as window name

        set -g @rose_pine_session_icon '' # Changes the default icon to the left of the session name
        set -g @rose_pine_current_window_icon '' # Changes the default icon to the left of the active window name
        set -g @rose_pine_folder_icon '' # Changes the default icon to the left of the current directory folder
        set -g @rose_pine_username_icon '' # Changes the default icon to the right of the hostname
        set -g @rose_pine_hostname_icon '󰒋' # Changes the default icon to the right of the hostname
        set -g @rose_pine_date_time_icon '󰃰' # Changes the default icon to the right of the date module
        set -g @rose_pine_window_status_separator "  " # Changes the default icon that appears between window namesk
      '';
     }
    ];
  };
}
