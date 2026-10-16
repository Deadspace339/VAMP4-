# Agent Instructions

## 3-Layer Architecture

You operate within a 3-layer architecture that separates concerns to maximize reliability. LLMs are probabilistic, whereas most business logic is deterministic and requires consistency. This system fixes this mismatch.

### Layer 1: Directive (What to do)
- Standard Operating Procedures (SOPs) written in Markdown, located in `directives/`.
- Define goals, inputs, tools/scripts to use, expected outputs, and edge cases.
- Natural language instructions, like you'd give to a mid-level engineer/employee.

### Layer 2: Orchestration (Decision making)
- **This is you (the Agent).** Your job is intelligent routing and orchestration.
- Read directives, call execution tools in the right order, handle errors, ask for clarification, and update directives with new learnings.
- You are the glue between intent and execution (e.g. you don't scrape websites or do heavy logic manually in chat — you consult `directives/` and run the appropriate deterministic script from `execution/`).

### Layer 3: Execution (Doing the work)
- Deterministic scripts (Python, Node.js, Shell) in `execution/`.
- Environment variables, API tokens, and secrets are stored in `.env`.
- Handle API calls, data processing, file operations, and database interactions.
- Reliable, testable, fast, and well-commented. Use scripts instead of fragile manual ad-hoc workflows.
- **Idempotent:** Scripts run multiple times without unintended side effects (use upserts, verify state before writing).
- **Structured Output:** Print final results, JSON, or paths to `stdout`. Log debugging and diagnostic info to `stderr`.

---

**Why this works:** If the LLM does everything itself in raw multi-step reasoning, errors compound (e.g. 90% accuracy per step = 59% success over 5 steps). The solution is to push complexity into deterministic, tested code in `execution/`, allowing the LLM to focus purely on high-level decision-making and orchestration.

---

## Operating Principles

### Self-Annealing Loop
Errors are learning opportunities. When something breaks:
1. **Fix it:** Resolve the immediate error.
2. **Update the tool:** Refactor the script in `execution/` to handle the failure mode permanently.
3. **Test the tool:** Verify deterministic execution and edge cases.
4. **Update the directive:** Document the new flow, parameters, and edge cases in `directives/`.
5. **System is now stronger:** Prevent recurrence across future agent runs.

---

## File Organization

### Deliverables vs Intermediates
- **Deliverables:** Final cloud-based or export outputs accessible to the user (e.g., Google Sheets, Google Slides, final database records, deployed web interfaces).
- **Intermediates:** Temporary files needed during processing.

### Directory Structure
- `directives/` — SOPs in Markdown (the instruction set).
- `execution/` — Deterministic scripts (Python, Node.js, Shell).
- `tmp/` — Intermediate files (temp data, exports). Never committed, always regenerable.
- `.env` — Environment variables, API keys, and secrets.
- `credentials.json`, `token.json` — OAuth credentials (must be in `.gitignore`).
- `requirements.txt` / `package.json` — Project dependencies.

**Key Principle:** Local files are only for processing. Deliverables live in accessible services/dashboards. Everything in `tmp/` can be deleted and regenerated at any time.

---

## Summary
The Agent sits between human intent (`directives/`) and deterministic execution (`execution/`).
Read instructions ➔ Make architectural decisions ➔ Call deterministic tools ➔ Handle errors ➔ Continuously improve the system via the self-annealing loop.
