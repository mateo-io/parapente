# agent-plans conventions

Plans are the project’s durable decision log. Keep the root small enough that it answers “what is being worked on?” at a glance.

## Lifecycle

```text
agent-plans/*.md           active implementation only
agent-plans/pipeline/*.md  accepted but deferred work
agent-plans/finished/*.md  shipped, abandoned, or superseded history
```

- Do not delete plan history. Move it and update its status.
- An active plan moves to `finished/` as soon as the scoped work is complete.
- If work is deliberately deferred, move its plan to `pipeline/`.

## Naming and header

Name plans `YYYY-MM-DD-kebab-case-title.md` and begin each plan with:

```markdown
# Title

> **Created:** YYYY-MM-DD
> **Status:** pipeline | in-progress | done | abandoned
> **Summary:** One sentence describing the outcome.
```

## Keeping plans current

- Check off work as it lands and add the concrete verification performed.
- Record any meaningful change of approach with `**Revised YYYY-MM-DD:** ...`.
- On completion, add a `**Shipped YYYY-MM-DD:** ...` note, set status to `done`, and move the file into `finished/`.
- Preserve earlier reasoning. Annotate superseded ideas instead of deleting them.
