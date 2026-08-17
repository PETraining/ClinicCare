---
description: Run the requirement-implementor agent to build a feature from its context-map.md/plan.md under teamupdates/features/<featurename>/.
argument-hint: [feature-name] [phase]
---
Use the requirement-implementor agent to implement: $ARGUMENTS

The first word/token is the feature-name (the folder under teamupdates/features/<featurename>/ whose context-map.md/plan.md — or legacy flat teamupdates/ docs — should be built from). An optional second token narrows scope to one phase (e.g. backend, frontend, week1, week2, gateway, or a specific deliverable); omit it to implement every phase the plan defines, in order.

Follow this repo's established architecture conventions (see CLAUDE.md) while implementing, stay within the scope the plan actually commits to, flag every assumption made to resolve ambiguity, and finish by appending/updating the one-line attribution tag on the context-map.md used as the spec.
