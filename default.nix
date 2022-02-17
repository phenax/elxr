{ pkgs ? import <nixpkgs> { } }:
with pkgs;
mkShell rec {
  buildInputs = [
    nodejs-16_x
    yarn
    efm-langserver
    nodePackages.prettier
    nodePackages.eslint
    nodePackages.typescript-language-server
  ];
}
