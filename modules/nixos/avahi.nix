{ ... }:

{
  services.avahi = {
    enable = true;
    allowInterfaces = [
      "wlp170s0"
    ];
    hostName = "epicNixOS";
  };
}
