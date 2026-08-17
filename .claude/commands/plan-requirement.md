---
description: Run the requirement-planner agent to turn a feature ask into a context-map.md and plan.md under teamupdates/features/<featurename>/.
argument-hint: [feature-name] [raw ask text if no intent.txt/context.txt exists yet]
---
Use the requirement-planner agent to plan: $ARGUMENTS

The first word/token is the feature-name (the folder under teamupdates/features/<featurename>/ to read from or create). Everything after it, if present, is the raw ask text — only needed when no intent.txt/context.txt already exists for that feature; when they exist, use them as the source instead of the raw text.

Produce both teamupdates/features/<featurename>/context-map.md (entrypoint, data flow, dependencies & contracts, where the epic lives in the codebase, risk areas/unknowns) and plan.md (phased, file-level implementation plan), grounded in the actual repo structure — not invented paths or assumptions.
