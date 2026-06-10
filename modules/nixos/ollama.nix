{ pkgs, ... }:
{
  services.ollama = {
    package = pkgs.ollama-vulkan;
    enable = true;
    rocmOverrideGfx = "11.5.1";
    environmentVariables = {
      HCC_AMDGPU_TARGET = "gfx1151";
      HSA_OVERRIDE_GFX_VERSION = "11.5.1";
      ROCR_VISIBLE_DEVICES = "0";      # force device 0
      OLLAMA_LLM_LIBRARY = "rocm";
      HIP_VISIBLE_DEVICES = "1";
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
    ];
  };
}
