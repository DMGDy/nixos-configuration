{ ... }:
{
  systemd.services.build-diff = {
    description = "epic build diff service";
    after = [ "network.target" ];
    wantedBy = [ "multi-user.target" ];
    serviceConfig = {
      Type = "simple";
      WorkingDirectory = "/var/www/html";
      ExecStart = "/var/www/html/build-diff";
      ExecStartPost = "/var/www/html/cache-builder";
      StandardOutput = "append:/var/log/build-diff.log";
      StandardError = "append:/var/log/build-diff.log";
    };
  };
}
