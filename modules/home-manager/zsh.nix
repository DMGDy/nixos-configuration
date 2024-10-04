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
    historySubstringSearch.enable = true;

    initExtra= ''
        VI_MODE_SET_CURSOR=true
        bindkey '^[[A' history-substring-search-up # or '\eOA'
        bindkey '^[[B' history-substring-search-down # or '\eOB'
        HISTORY_SUBSTRING_SEARCH_ENSURE_UNIQUE=1
    '';

    initExtraFirst = ''
      source ${pkgs.zsh-git-prompt}/share/zsh-git-prompt/zshrc.sh
      setopt PROMPT_SUBST
      setopt norcs

      PROMPT='%F{white}┌%f%F{white}[%f%F{magenta}%n%f%F{white}@%f%F{cyan}%m%f%F{white}]%f%F{8}::%f%F{white}[%f%F{blue}%~%f%F{white}]%f%F{8}::$(git_super_status) 
%F{white}└%f%F{white}[%f%F{yellow}$%f%F{white}]%f%F{green}❯%f '

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
        "zpm-zsh/pr-return"
        "zpm-zsh/pr-user"
        "unixorn/fzf-zsh-plugin"
        "Aloxaf/fzf-tab"
        "zsh-users/zsh-history-substring-search"
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
