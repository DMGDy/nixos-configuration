{ ... }:

{
  services.avahi = {
    enable = true;
    allowInterfaces = "
      wlp170s0
    ";
  };
}
