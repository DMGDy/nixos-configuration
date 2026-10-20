{ pkgs, lib, ... }:

# fzf-tab replaces zsh's completion menu with an fzf picker.
#
# Load order matters, and Home Manager pins the antidote bundle to mkOrder 550
# -- before compinit at 570. fzf-tab wants to be sourced after compinit and
# before the plugins that wrap ZLE widgets, so it is sourced here at 600
# instead of going through the antidote bundle:
#
#   550 antidote -> 570 compinit -> 600 fzf-tab -> 700 autosuggestions
#     -> 1200 syntax-highlighting -> 1250 history-substring-search
#
# Sourcing pkgs.zsh-fzf-tab also pins the version to the flake lock; the
# antidote bundle cloned an unpinned master into ~/.cache/antidote instead.
{
  programs.zsh.initContent = lib.mkOrder 600 ''
    source ${pkgs.zsh-fzf-tab}/share/fzf-tab/fzf-tab.plugin.zsh

    # fzf-tab draws the menu itself, so zsh's own menu has to stay off.
    zstyle ':completion:*' menu no
    # Colour candidates the way ls does; fzf-tab reads this, not LS_COLORS.
    zstyle ':completion:*' list-colors ''${(s.:.)LS_COLORS}
    # Group headers, so switch-group has something to label the groups with.
    zstyle ':completion:*:descriptions' format '[%d]'

    # The preview pane. Without an fzf-preview style fzf-tab never passes
    # --preview to fzf at all, which is what a bare completion menu looks like.
    # $realpath is only set for file/directory matches; everything else
    # (flags, git refs, processes) falls back to the candidate's description.
    zstyle ':fzf-tab:complete:*' fzf-preview '
      if [[ -d $realpath ]]; then
        ls -1 --color=always -- $realpath
      elif [[ -f $realpath ]]; then
        bat --color=always --style=numbers --line-range=:200 -- $realpath
      else
        print -r -- ''${desc:-$word}
      fi'

    # fzf-tab computes its own --height as
    # min(max(#matches + pad, fzf-min-height), LINES/3*2), so raise the floor
    # rather than passing --height in fzf-flags (which would override it).
    zstyle ':fzf-tab:*' fzf-min-height 20
    zstyle ':fzf-tab:*' fzf-flags --border --preview-window=right:55%:wrap
    zstyle ':fzf-tab:*' switch-group '<' '>'
  '';
}
