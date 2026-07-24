# Security Policy

## This repository contains agent instruction files

This project is a **PM decision kernel + skill plugin pack** designed to be read by AI agents (Codex, Claude Code, Cowork, etc.). The following files are **instruction files** — they contain prompts and directives meant for AI consumption:

- `AGENTS.md` — agent operating conventions
- `CLAUDE.md` — Claude Code entry point (redirects to AGENTS.md)
- `skills/*/SKILL.md` — atomic skill definitions with triggers and instructions
- `commands/*.md` — slash command workflows
- `kernel/writeback-contract.md` — writeback rules and state machine

These files are **designed to be read by agents**, not executed by humans. If you fork this repository and load it into your own AI agent, **review these files first** — they contain instructions that your agent will follow.

## What these files do NOT do

- They do not make network requests
- They do not execute arbitrary code
- They do not access your filesystem beyond the `workspace/` directory (user project data)
- They do not modify files outside the project directory

## Reporting security concerns

If you find content in these instruction files that could cause unintended agent behavior (e.g., prompt injection vectors, data exfiltration patterns), please open an issue describing the concern.
