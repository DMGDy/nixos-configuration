{ pkgs, ... }:
{
  services.ollama = {
    package = pkgs.ollama-rocm;
    enable = true;
    rocmOverrideGfx = "11.5.1";
    environmentVariables = {
      HCC_AMDGPU_TARGET = "gfx1151";
      ROCR_VISIBLE_DEVICES = "0";      # force device 0
      HIP_VISIBLE_DEVICES = "0";       # single APU GPU: same device as ROCR_VISIBLE_DEVICES
      OLLAMA_LOAD_TIMEOUT = "30m";     # gpt-oss:120b's ~61GiB weight load + MXFP4 compat conversion exceeds the 5m default
      OLLAMA_DEBUG = "1";
      HSA_ENABLE_SDMA = "0";
    };

    loadModels = [
      "qwen3:32b"
      "qwen3.5"
      "llama3.1"
      "deepseek-r1"
      "qwen3:30b-a3b"
      "qwen3.6"
      "qwen2.5:72b"
      "gpt-oss:120b"
    ];
  };
}
