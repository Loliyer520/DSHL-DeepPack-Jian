# DSHL settings compatibility patch

Upstream: @deepseek-ai/dsh-app-boot 0.2.0-rc.2 (MIT).

DSHL launches DSH from its version directory while profile plugins resolve another installed app-boot module. Its private bootstrapIncludes WeakMap cannot identify a root booted by the other copy. This breaks ConfigEditor reconciliation, including welcome acknowledgement and theme persistence.

The only local change in lib/index.js recovers the unique root Include entry from the shared Loader when the private WeakMap has no entry. It preserves failure when no unique entry exists. No settings write is skipped or silently accepted.

Distributed as a vendor package after dependency installation. Remove this fork when upstream supports independent launcher/profile installations.
