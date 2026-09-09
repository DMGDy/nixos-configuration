{ pkgs, ...}:
{
  services.tomcat.enable = true;
  
  services.tomcat.port = 9090;

  services.tomcat.user = "dylandy";

  services.tomcat.package = pkgs.tomcat10;

  services.tomcat.webapps = [ 
    /var/www/html/opengrok/dist/lib/source.war
  ];
}
