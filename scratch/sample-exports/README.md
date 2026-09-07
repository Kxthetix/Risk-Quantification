# Sample exports (harness fixture — not model output)

These two files were produced by `npm run check:exports` from the real 254-control framework
catalogue and the real 18-finding sample scan, but with **deterministic placeholder risk figures**
standing in for model output, because no trained artefact is loaded yet.

They are here to show what the two regulatory deliverables look like. Every rupee figure in them
is a placeholder. Both files say so on their own first page / Summary sheet.

Regenerate with:

    npm run check:exports                    # writes to a temp directory
    node scripts/check-exports.cjs <dir>     # writes here instead
