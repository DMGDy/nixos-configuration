{ config, pkgs, ... }:
# system packages 
{
  environment.systemPackages = with pkgs; [
    grub2_efi
    kitty
    git
    tree
    home-manager
    xdg-desktop-portal-hyprland
    openssh
    xwayland
    tmux
    dunst
    eww
    pipewire
    rtkit
    firefox
    gtk3
    mako
    wl-clipboard
    alacritty
    wezterm
    zsh
    mako
    foot
    discord
    pavucontrol
    tig
    powerline
    powerline-fonts
    oh-my-zsh
    fzf
    fzf-zsh
    silver-searcher
    ripgrep
    nerdfetch
    neovide
    wpgtk
    wallust
    swww
    dash
    pfetch-rs
    hyprshot
    catppuccin-sddm
    bat
    python3Full
    gccgo
    libgcc
    gnumake
    clang
    cmake
    go
    nodejs_22
    brightnessctl
    coreutils-full
    file
    tofi
    catppuccin-sddm-corners
    cargo
    unicode-paracode
    man-pages
    man
    man-pages-posix
    iw
    pulseaudioFull
    spotify
    spotifyd
    libinput
    btop
    blueman
    dconf
    whatsapp-for-linux
    whatsapp-emoji-font
    nchat
    socat
    gdb
    valgrind
    xournalpp
    perf-tools
    wayfarer
    stm32cubemx
    stm32flash
    qemu
    linuxKernel.packages.linux_6_6.virtualbox
    ascii-image-converter
    stlink
    gptfdisk 
    usbutils
    picocom
    mmc-utils
    udftools
    libudfread
    zip
    unzip
    dfu-util
    libusb1
    ungoogled-chromium
    pkg-config
    openssl
    libressl
    trunk
    rustup
    nginx
    wabt
    ncdu
    yazi
    qimgv
    gimp
    tcpdump
    hexdino
    marp-cli
    zathura
    wirelesstools
    linuxKernel.packages.linux_6_6.perf
    ffmpeg
    vscode
    dbus
    dbus-glib
    pkg-config
    maven
    netbeans
    jre_minimal
    jdk
    ant
    texliveFull
    imagemagick
    imv
    grim
    slurp
    swappy
    xdg-desktop-portal-hyprland
    teams-for-linux
    hyprcursor
    pipes-rs
    asciiquarium
    ganttproject-bin
    dtc
    projectlibre
    libreoffice-fresh
    ffmpeg_7-headless
    mpv
    google-cursor
    avahi
    oreo-cursors-plus
    breeze-hacked-cursor-theme
    whitesur-cursors
    zenity
    where-is-my-sddm-theme
    ly
    swww
    mesa
    shellcheck
    antidote
    gitstatus
    noisetorch
    kmag
    zsh-git-prompt
    reveal-md
    zapzap
    cbonsai
    obs-studio
    video-trimmer
    nchat
    discordo
    gnome-keyring
    can-utils
    hare
    harec
    haredoc
    pitivi
    hyprpicker
    meld
    pympress
    fzy
  ];
}
