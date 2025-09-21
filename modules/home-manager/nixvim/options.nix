{
  programs.nixvim = {
    globals = {
      neovide_transparency = 0.8;
      globals.c_syntax_for_h = 1;
    };
    clipboard = {
      providers.wl-copy.enable = true;
      register="unnamedplus";
    };
    opts = {
      number = true;
      relativenumber = true;
      tabstop = 2;
      shiftwidth = 2;
      autoindent = true;
      expandtab = true;
      signcolumn = "yes";

      foldlevel = 100;
      updatetime = 50;
      completeopt = ["menuone" "noselect" "noinsert"];
    };
    extraConfigLua = ''
    -- ========= Core options for a "full terminal" feel =========
      vim.opt.termguicolors = true
      vim.opt.number = false
      vim.opt.relativenumber = true 
      vim.opt.signcolumn = "no"
      vim.opt.laststatus = 0          -- hide statusline
      vim.opt.showmode = false
      vim.opt.ruler = false
      vim.opt.cmdheight = 0           -- auto-hide cmdline (Neovim 0.9+)

      -- Respect user shell, but you can hardcode if desired:

      -- ========= Terminal behavior & keymaps =========
         -- Enter Normal mode from terminal with <Esc>
        vim.keymap.set("t", "<C-Esc>", [[<C-\><C-n>]], { desc = "Outer: terminal → Normal" })


        -- Clean terminal buffers visually
        vim.api.nvim_create_autocmd("TermOpen", {
          pattern = "*",
          callback = function()
          vim.opt_local.number = false
          vim.opt_local.relativenumber = false
          vim.opt_local.signcolumn = "no"
          vim.opt_local.scrolloff = 0

          vim.keymap.set("t", "<C-Esc>", [[<C-\><C-n>]], { buffer = true, silent = true })
          vim.cmd.startinsert()
          end,
        })

        -- Auto-open a terminal if Neovim is launched without files
        vim.api.nvim_create_autocmd("VimEnter", {
          callback = function()
          if vim.fn.argc() == 0 then
          vim.cmd("enew | term")
          vim.cmd("startinsert")
          end
          end,
        })

        -- Quickly spawn a new terminal in a split
        vim.keymap.set("n", "<leader>tt", function()
        end, { desc = "Open terminal in split" })
        -- ---------- Neovide runtime controls ----------
        if vim.g.neovide then
        -- Opacity (replacement for deprecated transparency var)
        vim.g.neovide_opacity = 0.7
        vim.g.neovide_normal_opacity = 0.7  -- keep normal bg at same opacity
        -- (Transparency/opacity is configured via Neovim globals, not TOML.)  -- see docs

        -- Zoom bindings
        vim.g.neovide_scale_factor = 1.0
        local function change_scale(delta) vim.g.neovide_scale_factor = vim.g.neovide_scale_factor * delta end
        vim.keymap.set("n", "<C-=>", function() change_scale(1.1) end,   { desc = "Neovide zoom in" })
        vim.keymap.set("n", "<C-->", function() change_scale(1/1.1) end, { desc = "Neovide zoom out" })
        vim.keymap.set("n", "<C-0>", function() vim.g.neovide_scale_factor = 1.0 end, { desc = "Neovide zoom reset" })
        vim.keymap.set({ "n", "x" }, "<C-S-C>", '"+y', { desc = "Copy system clipboard" })
        vim.keymap.set({ "n", "x" }, "<C-S-V>", '"+p', { desc = "Paste system clipboard" })
        

        vim.g.neovide_cursor_smooth_blink = true
        -- Cursor VFX: default railgun; toggle to sonicboom
        vim.g.neovide_cursor_animation_length = 0.06
        vim.g.neovide_cursor_trail_size = 0.5
        vim.g.neovide_cursor_vfx_mode = {"railgun", "sonicboom"}  -- or "sonicboom"

        end

          '';
        };
      }
