{
  description = "Nixos config flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    nixpkgs_stable.url ="github:nixos/nixpkgs/nixos-25.05";
    hyprland.url = "git+https://github.com/hyprwm/Hyprland?submodules=1";
    home-manager = {
      url = "github:nix-community/home-manager";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    stylix = {
      url = "github:danth/stylix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    
    nixvim = {
      url = "github:nix-community/nixvim";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    nix-environments.url = "github:nix-community/nix-environments";
    # epic status bar i made
    epic-bar-rs.url = "github:DMGDy/epic-bar-rs";
  };
  outputs = { self, nixpkgs, nixpkgs_stable , ... }@inputs: 
  let 
    system = "x86_64-linux";
    pkgs = import nixpkgs_stable {
      inherit system;
      config = {
        allowUnfree = true;
      };
    };
  in
  {
    nixosConfigurations = {

      framework = nixpkgs.lib.nixosSystem {
        specialArgs = { 
          inherit inputs system; 
        };
        modules = [
          inputs.home-manager.nixosModules.default
          ./hosts/framework/configuration.nix
          # Custom Modules
          inputs.nixvim.nixosModules.nixvim
          ./modules/nixos/hardware.nix
        ];
      };

      t7910= nixpkgs_stable.lib.nixosSystem {
        specialArgs = { 
          inherit inputs system; 
        };
        modules = [
          inputs.home-manager.nixosModules.default
          ./hosts/t7910/configuration.nix
          # Custom Modules
          inputs.nixvim.nixosModules.nixvim
          #./modules/nixos/hardware.nix
          ./modules/nixos/nvidia.nix
        ];
      };

      framework_desktop= nixpkgs_stable.lib.nixosSystem {
        specialArgs = { 
          inherit inputs system; 
        };
        modules = [
          inputs.home-manager.nixosModules.default
          ./hosts/framework_desktop/configuration.nix
          inputs.nixvim.nixosModules.nixvim
        ];
      };


    };
  };
}
