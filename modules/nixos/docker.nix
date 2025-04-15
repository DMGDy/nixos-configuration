{ ... }:

{
  virtualisation.docker.enable = true;
  users = {
    users.dylandy.extraGroups = [ "docker" ];
  }
}
