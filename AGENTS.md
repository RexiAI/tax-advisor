# Engineering Standards (pointer)

This repo follows the shared engineering standards maintained in the
`.standards/` git submodule. This file is a real file, not a symlink, on
purpose: CI and hosting platforms check out without initializing submodules,
and a dangling `AGENTS.md` symlink crashes builds that stat it (Next.js
>= 15.5 fails with ENOENT at startup).

Run `git submodule update --init --recursive`, then read the full standards
index at [.standards/AGENTS.md](.standards/AGENTS.md).
