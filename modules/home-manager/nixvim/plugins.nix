{pkgs, ... }:
{

  programs.nixvim.plugins = {

    lualine = {
      enable = true;
      settings = {
        options = {
          theme = "iceberg_light";
          component_separators = { left = ""; right = ""; };
          section_separators = { left = ""; right = ""; };
          globalstatus = true;
          disabled_filetypes = {
            statusline = [ "oil" "trouble" ];
          };
        };
        sections = {
          lualine_a = [ "mode" ];
          lualine_b = [ "branch" "diff" "diagnostics" ];
          lualine_c = [ { __unkeyed-1 = "filename"; path = 1; } ];
          lualine_x = [ "encoding" "fileformat" "filetype" ];
          lualine_y = [ "progress" ];
          lualine_z = [ "location" ];
        };
        inactive_sections = {
          lualine_a = [ ];
          lualine_b = [ ];
          lualine_c = [ "filename" ];
          lualine_x = [ "location" ];
          lualine_y = [ ];
          lualine_z = [ ];
        };
      };
    };


    web-devicons.enable = true;
    
    nvim-autopairs.enable  = true;

    indent-blankline.enable = true;

    markdown-preview= {
      enable = true;
      settings = {
        autostart = 1;
        auto_start = 1;
        browser = "firefox";
      };
    };

    transparent.enable = true;

    treesitter = {
      enable = true;
      nixvimInjections = true;
      folding.enable = true;
      settings.indent.enabled= true;

      highlight = {
        enable = true;
        disable = [
          "scss"
          "ipkg"
        ];
      };
    };
    hmts.enable = true;

    clangd-extensions.enable = true;
    nix.enable = true;

    lspkind.enable = true;
    luasnip.enable = true;

    noice = {
      enable = false;
    };
    
    vim-css-color = {
      enable = true;
    };

    render-markdown = {
      enable = true;
    };

    ansiesc = {
      enable = true;
    };

    oil = {
      enable = true;
      luaConfig = {
        post = ''
        require("oil").setup({
          -- Oil will take over directory buffers (e.g. `vim .` or `:e src/`)
          -- Set to false if you want some other plugin (e.g. netrw) to open when you edit directories.
          default_file_explorer = true,
          -- Id is automatically added at the beginning, and name at the end
          -- See :help oil-columns
          columns = {
            "icon",
            "permissions",
            "size",
            "mtime",
          },
          -- Buffer-local options to use for oil buffers
          buf_options = {
            buflisted = false,
            bufhidden = "hide",
          },
          -- Window-local options to use for oil buffers
          win_options = {
            wrap = false,
            signcolumn = "no",
            cursorcolumn = false,
            foldcolumn = "0",
            spell = false,
            list = false,
            conceallevel = 3,
            concealcursor = "nvic",
          },
          -- Send deleted files to the trash instead of permanently deleting them (:help oil-trash)
          delete_to_trash = false,
          -- Skip the confirmation popup for simple operations (:help oil.skip_confirm_for_simple_edits)
          skip_confirm_for_simple_edits = true,
          -- Selecting a new/moved/renamed file or directory will prompt you to save changes first
          -- (:help prompt_save_on_select_new_entry)
          prompt_save_on_select_new_entry = true,
          -- Oil will automatically delete hidden buffers after this delay
          -- You can set the delay to false to disable cleanup entirely
          -- Note that the cleanup process only starts when none of the oil buffers are currently displayed
          cleanup_delay_ms = 2000,
          lsp_file_methods = {
            -- Enable or disable LSP file operations
            enabled = true,
            -- Time to wait for LSP file operations to complete before skipping
            timeout_ms = 1000,
            -- Set to true to autosave buffers that are updated with LSP willRenameFiles
            -- Set to "unmodified" to only save unmodified buffers
            autosave_changes = false,
          },
          -- Constrain the cursor to the editable parts of the oil buffer
          -- Set to `false` to disable, or "name" to keep it on the file names
          constrain_cursor = "editable",
          -- Set to true to watch the filesystem for changes and reload oil
          watch_for_changes = false,
          -- Keymaps in oil buffer. Can be any value that `vim.keymap.set` accepts OR a table of keymap
          -- options with a `callback` (e.g. { callback = function() ... end, desc = "", mode = "n" })
          -- Additionally, if it is a string that matches "actions.<name>",
          -- it will use the mapping at require("oil.actions").<name>
          -- Set to `false` to remove a keymap
          -- See :help oil-actions for a list of all available actions
          keymaps = {
            ["g?"] = { "actions.show_help", mode = "n" },
            ["<CR>"] = "actions.select",
            ["<C-s>"] = { "actions.select", opts = { vertical = true } },
            ["<C-h>"] = { "actions.select", opts = { horizontal = true } },
            ["<C-t>"] = { "actions.select", opts = { tab = true } },
            ["<C-p>"] = "actions.preview",
            ["<C-c>"] = { "actions.close", mode = "n" },
            ["<C-l>"] = "actions.refresh",
            ["-"] = { "actions.parent", mode = "n" },
            ["_"] = { "actions.open_cwd", mode = "n" },
            ["`"] = { "actions.cd", mode = "n" },
            ["g~"] = { "actions.cd", opts = { scope = "tab" }, mode = "n" },
            ["gs"] = { "actions.change_sort", mode = "n" },
            ["gx"] = "actions.open_external",
            ["g."] = { "actions.toggle_hidden", mode = "n" },
            ["g\\"] = { "actions.toggle_trash", mode = "n" },
          },
          -- Set to false to disable all of the above keymaps
          use_default_keymaps = true,
          view_options = {
            -- Show files and directories that start with "."
            show_hidden = true,
            -- This function defines what is considered a "hidden" file
            is_hidden_file = function(name, bufnr)
            local m = name:match("^%.")
            return m ~= nil
            end,
            -- This function defines what will never be shown, even when `show_hidden` is set
            is_always_hidden = function(name, bufnr)
            return false
            end,
            -- Sort file names with numbers in a more intuitive order for humans.
            -- Can be "fast", true, or false. "fast" will turn it off for large directories.
            natural_order = "fast",
            -- Sort file and directory names case insensitive
            case_insensitive = false,
            sort = {
              -- sort order can be "asc" or "desc"
              -- see :help oil-columns to see which columns are sortable
              { "type", "asc" },
              { "name", "asc" },
            },
            -- Customize the highlight group for the file name
            highlight_filename = function(entry, is_hidden, is_link_target, is_link_orphan)
            return nil
            end,
          },
          -- Extra arguments to pass to SCP when moving/copying files over SSH
          extra_scp_args = {},
          -- Extra arguments to pass to aws s3 when creating/deleting/moving/copying files using aws s3
          extra_s3_args = {},
          -- EXPERIMENTAL support for performing file operations with git
          git = {
            -- Return true to automatically git add/mv/rm files
            add = function(path)
            return false
            end,
            mv = function(src_path, dest_path)
            return false
            end,
            rm = function(path)
            return false
            end,
          },
          -- Configuration for the floating window in oil.open_float
          float = {
            -- Padding around the floating window
            padding = 2,
            -- max_width and max_height can be integers or a float between 0 and 1 (e.g. 0.4 for 40%)
            max_width = 0,
            max_height = 0,
            border = nil,
            win_options = {
              winblend = 0,
            },
            -- optionally override the oil buffers window title with custom function: fun(winid: integer): string
            get_win_title = nil,
            -- preview_split: Split direction: "auto", "left", "right", "above", "below".
            preview_split = "below",
            -- This is the config that will be passed to nvim_open_win.
            -- Change values here to customize the layout
            override = function(conf)
            return conf
            end,
          },
          -- Configuration for the file preview window
          preview_win = {
            -- Whether the preview window is automatically updated when the cursor is moved
            update_on_cursor_moved = true,
            -- How to open the preview window "load"|"scratch"|"fast_scratch"
            preview_method = "fast_scratch",
            -- A function that returns true to disable preview on a file e.g. to avoid lag
            disable_preview = function(filename)
              -- Disable preview for binary/large files
              local binary_ext = { "png", "jpg", "jpeg", "gif", "bmp", "ico", "webp", "svg",
                                   "mp3", "mp4", "avi", "mkv", "mov", "wav", "flac",
                                   "zip", "tar", "gz", "rar", "7z", "bz2", "xz",
                                   "exe", "dll", "so", "o", "a", "bin",
                                   "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx" }
              local ext = filename:match("%.([^%.]+)$")
              if ext then
                ext = ext:lower()
                for _, binary in ipairs(binary_ext) do
                  if ext == binary then
                    return true
                  end
                end
              end
              -- Check file size (disable for files > 1MB)
              local stat = vim.loop.fs_stat(filename)
              if stat and stat.size > 1024 * 1024 then
                return true
              end
              return false
            end,
            -- Window-local options to use for preview window buffers
            win_options = {
              number = true,
              relativenumber = false,
              wrap = false,
            },
          },
          -- Configuration for the floating action confirmation window
          confirmation = {
            -- Width dimensions can be integers or a float between 0 and 1 (e.g. 0.4 for 40%)
            -- min_width and max_width can be a single value or a list of mixed integer/float types.
            -- max_width = {100, 0.8} means "the lesser of 100 columns or 80% of total"
            max_width = 0.9,
            -- min_width = {40, 0.4} means "the greater of 40 columns or 40% of total"
            min_width = { 40, 0.4 },
            -- optionally define an integer/float for the exact width of the preview window
            width = nil,
            -- Height dimensions can be integers or a float between 0 and 1 (e.g. 0.4 for 40%)
            -- min_height and max_height can be a single value or a list of mixed integer/float types.
            -- max_height = {80, 0.9} means "the lesser of 80 columns or 90% of total"
            max_height = 0.9,
            -- min_height = {5, 0.1} means "the greater of 5 columns or 10% of total"
            min_height = { 5, 0.1 },
            -- optionally define an integer/float for the exact height of the preview window
            height = nil,
            border = nil,
            win_options = {
              winblend = 0,
            },
          },
          -- Configuration for the floating progress window
          progress = {
            max_width = 0.9,
            min_width = { 40, 0.4 },
            width = nil,
            max_height = { 10, 0.9 },
            min_height = { 5, 0.1 },
            height = nil,
            border = nil,
            minimized_border = "none",
            win_options = {
              winblend = 0,
            },
          },
          -- Configuration for the floating SSH window
          ssh = {
            border = nil,
          },
          -- Configuration for the floating keymaps help window
          keymaps_help = {
            border = nil,
          },
        })
        '';

      };
    };
  };
}
