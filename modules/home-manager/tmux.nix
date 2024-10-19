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
      set -g @resurrect-capture-pane-contents 'on'
      set -g @resurrect-strategy-nvim 'session'

      set -g status-position bottom
      set -g status-justify left
      # show date and time
      set -g status-left ''
      set -g status-right '%d-%m-%Y %H:%M'

      # colors active tags 
      setw -g window-status-current-style 'fg=white bg=blue'
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
    ];
  };
}
