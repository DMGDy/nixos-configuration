{ pkgs, ... }:

{
  environment.systemPackages = with pkgs; [
    (python3.withPackages(ps: with ps; [
      psutil
      numpy
      pandas
      matplotlib
      sklearn-deap
    ]))
  ];
}
