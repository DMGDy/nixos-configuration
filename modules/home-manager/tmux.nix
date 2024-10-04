{ ... }:

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
      set -g status-position bottom
      set -g status-justify left

      # show date and time
      set -g status-left ''
      set -g status-right '%d-%m-%Y %H:%M'

      # colors active tags 
      setw -g window-status-current-style 'fg=white bg=magenta'
      setw -g window-status-current-format ' #I #W #F '




      # unbind arrow keys and pane switching keys

      unbind Up     
      unbind Down   
      unbind Left   
      unbind Right  

      unbind C-Up   
      unbind C-Down 
      unbind C-Left 
      unbind C-Right

      # bind vim keys to moving around
      bind -r k select-pane -U 
      bind -r j select-pane -D 
      bind -r h select-pane -L 
      bind -r l select-pane -R
    ";
  };
}
