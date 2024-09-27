{ pkgs, ... }:

{
  programs.zsh = {
    enable = true;

    dotDir = ".zshdir/";
    autosuggestion.enable = true;
    enableCompletion = true;
    syntaxHighlighting.enable = false;

    shellAliases = {
      ls = "ls --color=auto";
      shutdown = "sudo shutdown -h now";
    };

    history = {
      share = false;
      size  = 50000;
      path = "/home/dylandy/.zshdir/.zsh_history";
    };

    initExtra= ''
        VI_MODE_SET_CURSOR=true
        DISABLE_FZF_AUTO_COMPLETION="false"
    '';

    initExtraFirst = ''
      autoload -Uz vcs_info
      setopt prompt_subst
      autoload -Uz vcs_info
      precmd() { vcs_info }

      
      zstyle ':vcs_info:git:*' check-for-changes true
      zstyle ':vcs_info:git:*' stagedstr '%F{yellow}●%f'
      zstyle ':vcs_info:git:*' unstagedstr '%F{red}●%f'
      zstyle ':vcs_info:git:*' formats '%F{green}(%b)%f %c%u'
      zstyle ':vcs_info:git:*' actionformats '%F{green}(%b|%a)%f %c%u'

      setopt PROMPT_SUBST

      PROMPT='%F{red}┌%f%F{red}[%f%F{magenta}%n%f%F{white}@%f%F{cyan}%m%f%F{red}]%f%F{8}::%f%F{red}[%f%F{blue}%~%f%F{red}]%f%F{8}::%f%F{red}[%f$vcs_info_msg_0_%F{red}]%f 
%F{red}└%f%F{red}[%f%F{yellow}$%f%F{red}]%f%F{green}❯%f '

      # Right prompt for additional information (e.g., time)
      RPROMPT='%F{green}$pr_return%f'
      pfetch
    '';

    antidote = {
      enable = true;
      plugins = [
        "jeffreytse/zsh-vi-mode"
        "zpm-zsh/colors"
        "zpm-zsh/figures"
        "zsh-users/zsh-autosuggestions"
        "zsh-users/zsh-syntax-highlighting"
        "zpm-zsh/pr-git"
        "zpm-zsh/pr-return"
        "zpm-zsh/pr-user"
        "unixorn/fzf-zsh-plugin"
      ];
    };

    oh-my-zsh = {
      enable = false;
      plugins = [
        "git"
        "colored-man-pages"
        "fzf"
        "vi-mode"
      ];
      custom = "/home/dylandy/.zshdir/oh-my-zsh/themes";
      theme = "agnoster_custom";

    };
  };
}
