{ ... }:

{
  virtualisation.docker.enable = true;
  users = {
    users.dylandy.extraGroups = [ "docker" ];
    users.rezi.extraGroups = [ "docker" ];
  };
}
