{
  programs.nixvim.plugins = {

    # ============ Fuzzy Finding ============
    telescope = {
      enable = true;
      extensions = {
        fzf-native.enable = true;
        ui-select.enable = true;
      };
      keymaps = {
        "<leader>ff" = { action = "find_files"; options.desc = "Find files"; };
        "<leader>fg" = { action = "live_grep"; options.desc = "Live grep"; };
        "<leader>fb" = { action = "buffers"; options.desc = "Find buffers"; };
        "<leader>fh" = { action = "help_tags"; options.desc = "Help tags"; };
        "<leader>fr" = { action = "oldfiles"; options.desc = "Recent files"; };
        "<leader>fs" = { action = "lsp_document_symbols"; options.desc = "Document symbols"; };
        "<leader>fS" = { action = "lsp_workspace_symbols"; options.desc = "Workspace symbols"; };
        "<leader>fd" = { action = "diagnostics"; options.desc = "Diagnostics"; };
        "<leader>fc" = { action = "git_commits"; options.desc = "Git commits"; };
        "<leader>gb" = { action = "git_branches"; options.desc = "Git branches"; };
      };
    };

    # ============ Keybinding Hints ============
    which-key = {
      enable = true;
      settings = {
        delay = 200;
        icons = {
          breadcrumb = "»";
          separator = "➜";
          group = "+";
        };
        spec = [
          { __unkeyed-1 = "<leader>f"; group = "Find/Telescope"; }
          { __unkeyed-1 = "<leader>g"; group = "Git"; }
          { __unkeyed-1 = "<leader>c"; group = "Code"; }
          { __unkeyed-1 = "<leader>t"; group = "Terminal/Toggle"; }
          { __unkeyed-1 = "<leader>x"; group = "Diagnostics"; }
        ];
      };
    };

    # ============ Git Integration ============
    gitsigns = {
      enable = true;
      settings = {
        current_line_blame = true;
        current_line_blame_opts = {
          delay = 500;
          virt_text_pos = "eol";
        };
        signs = {
          add = { text = "│"; };
          change = { text = "│"; };
          delete = { text = "_"; };
          topdelete = { text = "‾"; };
          changedelete = { text = "~"; };
        };
      };
    };

    # ============ Commenting ============
    comment = {
      enable = true;
      settings = {
        toggler = {
          line = "gcc";
          block = "gbc";
        };
        opleader = {
          line = "gc";
          block = "gb";
        };
      };
    };

    # ============ Diagnostics List ============
    trouble = {
      enable = true;
      settings = {
        auto_close = true;
        use_diagnostic_signs = true;
      };
    };

    # ============ LSP Progress Indicator ============
    fidget = {
      enable = true;
      settings = {
        progress = {
          display = {
            done_icon = "✓";
          };
        };
        notification = {
          window = {
            winblend = 0;
          };
        };
      };
    };

    # ============ TODO Comments Highlighting ============
    todo-comments = {
      enable = true;
      settings = {
        signs = true;
        keywords = {
          FIX = { icon = " "; color = "error"; alt = [ "FIXME" "BUG" "FIXIT" "ISSUE" ]; };
          TODO = { icon = " "; color = "info"; };
          HACK = { icon = " "; color = "warning"; };
          WARN = { icon = " "; color = "warning"; alt = [ "WARNING" "XXX" ]; };
          PERF = { icon = " "; alt = [ "OPTIM" "PERFORMANCE" "OPTIMIZE" ]; };
          NOTE = { icon = " "; color = "hint"; alt = [ "INFO" ]; };
        };
      };
    };

    # ============ Snippets Collection ============
    friendly-snippets.enable = true;

    # ============ Surround (brackets, quotes, etc) ============
    nvim-surround = {
      enable = true;
    };

    # ============ Better Quickfix ============
    nvim-bqf = {
      enable = true;
    };

    # ============ Illuminate (highlight same words) ============
    illuminate = {
      enable = true;
      delay = 200;
      underCursor = true;
    };

    # ============ Formatting ============
    conform-nvim = {
      enable = true;
      settings = {
        notify_on_error = false;
        format_on_save = null;
        formatters_by_ft = {
          python = [ "black" ];
          javascript = [ "prettier" ];
          typescript = [ "prettier" ];
          json = [ "prettier" ];
          yaml = [ "prettier" ];
          markdown = [ "prettier" ];
          html = [ "prettier" ];
          css = [ "prettier" ];
          rust = [ "rustfmt" ];
          go = [ "gofmt" ];
          c = [ "clang-format" ];
          cpp = [ "clang-format" ];
        };
      };
    };

    # ============ Better UI for LSP ============
    lspsaga = {
      enable = true;
      lightbulb.enable = false;
      ui = {
        border = "rounded";
        codeAction = "💡";
      };
    };

  };

  # Additional keymaps for the new plugins
  programs.nixvim.keymaps = [
    # Trouble diagnostics
    { mode = "n"; key = "<leader>xx"; action = "<cmd>Trouble diagnostics toggle<cr>"; options.desc = "Diagnostics (Trouble)"; }
    { mode = "n"; key = "<leader>xX"; action = "<cmd>Trouble diagnostics toggle filter.buf=0<cr>"; options.desc = "Buffer Diagnostics"; }
    { mode = "n"; key = "<leader>xs"; action = "<cmd>Trouble symbols toggle focus=false<cr>"; options.desc = "Symbols (Trouble)"; }
    { mode = "n"; key = "<leader>xq"; action = "<cmd>Trouble qflist toggle<cr>"; options.desc = "Quickfix (Trouble)"; }

    # LSPSaga - Definition/Navigation
    { mode = "n"; key = "<leader>co"; action = "<cmd>Lspsaga outline<cr>"; options.desc = "Code Outline"; }
    { mode = "n"; key = "<leader>cf"; action = "<cmd>Lspsaga finder<cr>"; options.desc = "LSP Finder (refs + impl)"; }
    { mode = "n"; key = "<leader>cp"; action = "<cmd>Lspsaga peek_definition<cr>"; options.desc = "Peek Definition"; }
    { mode = "n"; key = "<leader>cP"; action = "<cmd>Lspsaga peek_type_definition<cr>"; options.desc = "Peek Type Definition"; }
    { mode = "n"; key = "<leader>cd"; action = "<cmd>Lspsaga goto_definition<cr>"; options.desc = "Goto Definition (Saga)"; }
    { mode = "n"; key = "<leader>ct"; action = "<cmd>Lspsaga goto_type_definition<cr>"; options.desc = "Goto Type Definition"; }
    { mode = "n"; key = "<leader>ci"; action = "<cmd>Lspsaga incoming_calls<cr>"; options.desc = "Incoming Calls"; }
    { mode = "n"; key = "<leader>cO"; action = "<cmd>Lspsaga outgoing_calls<cr>"; options.desc = "Outgoing Calls"; }

    # Telescope LSP navigation
    { mode = "n"; key = "<leader>fd"; action = "<cmd>Telescope lsp_definitions<cr>"; options.desc = "Find Definitions"; }
    { mode = "n"; key = "<leader>fi"; action = "<cmd>Telescope lsp_implementations<cr>"; options.desc = "Find Implementations"; }
    { mode = "n"; key = "<leader>fR"; action = "<cmd>Telescope lsp_references<cr>"; options.desc = "Find References"; }

    # Git hunks (gitsigns)
    { mode = "n"; key = "]h"; action = "<cmd>Gitsigns next_hunk<cr>"; options.desc = "Next git hunk"; }
    { mode = "n"; key = "[h"; action = "<cmd>Gitsigns prev_hunk<cr>"; options.desc = "Prev git hunk"; }
    { mode = "n"; key = "<leader>gp"; action = "<cmd>Gitsigns preview_hunk<cr>"; options.desc = "Preview hunk"; }
    { mode = "n"; key = "<leader>gs"; action = "<cmd>Gitsigns stage_hunk<cr>"; options.desc = "Stage hunk"; }
    { mode = "n"; key = "<leader>gr"; action = "<cmd>Gitsigns reset_hunk<cr>"; options.desc = "Reset hunk"; }
    { mode = "n"; key = "<leader>gS"; action = "<cmd>Gitsigns stage_buffer<cr>"; options.desc = "Stage buffer"; }
    { mode = "n"; key = "<leader>gu"; action = "<cmd>Gitsigns undo_stage_hunk<cr>"; options.desc = "Undo stage hunk"; }

    # Todo comments
    { mode = "n"; key = "]t"; action = "<cmd>lua require('todo-comments').jump_next()<cr>"; options.desc = "Next TODO"; }
    { mode = "n"; key = "[t"; action = "<cmd>lua require('todo-comments').jump_prev()<cr>"; options.desc = "Prev TODO"; }
    { mode = "n"; key = "<leader>ft"; action = "<cmd>TodoTelescope<cr>"; options.desc = "Find TODOs"; }

    # Oil file explorer
    { mode = "n"; key = "<leader>o"; action = "<cmd>Oil<cr>"; options.desc = "Open Oil (current dir)"; }
    { mode = "n"; key = "<leader>O"; action = "<cmd>Oil .<cr>"; options.desc = "Open Oil (project root)"; }
  ];
}
