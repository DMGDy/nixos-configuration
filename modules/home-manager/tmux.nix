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

    extraConfig = "
      set -g @plugin 'tmux-plugins/tmux-resurrect'
      set -g @plugin 'omerxx/tmux-floax'
      set -g @plugin 'tmux-plugins/tmux-yank'
      set -g @plugin 'tmux-plugins/tmux-sidebar'
      set -g @plugin 'rose-pine/tmux'
      set -g @resurrect-capture-pane-contents 'on'
      set -g @resurrect-strategy-nvim 'session'


      set -g status-position bottom
      set -g status-justify left
      # show date and time
      set -g status-left ''
      set -g status-right '%d-%m-%Y %H:%M'

      # colors active tags 
      setw -g window-status-current-format ' #I #W #F '

      # start windows and panes at 1, not 0 set -g base-index 1
      setw -g pane-base-index 1

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

    ";
    plugins = with pkgs.tmuxPlugins; [
     resurrect
     tmux-floax
     yank
     sidebar
     {
      plugin = rose-pine;
      extraConfig = ''
        set -g @rose_pine_variant 'main' # Options are 'main', 'moon' or 'dawn'
        set -g @rose_pine_left_separator ' > ' # The strings to use as separators are 1-space padded
        set -g @rose_pine_right_separator ' < ' # Accepts both normal chars & nerdfont icons
        set -g @rose_pine_field_separator ' | ' # Again, 1-space padding, it updates with prefix + I
        set -g @rose_pine_window_separator ' - ' # Replaces the default `:` between the window number and name

        set -g @rose_pine_session_icon '' # Changes the default icon to the left of the session name
        set -g @rose_pine_current_window_icon '' # Changes the default icon to the left of the active window name
        set -g @rose_pine_folder_icon '' # Changes the default icon to the left of the current directory folder
        set -g @rose_pine_username_icon '' # Changes the default icon to the right of the hostname
        set -g @rose_pine_hostname_icon '󰒋' # Changes the default icon to the right of the hostname
        set -g @rose_pine_date_time_icon '󰃰' # Changes the default icon to the right of the date module
      '';
     }
    ];
  };
}
