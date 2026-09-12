# PR #23 review follow-up

The one-time source transfer has been removed. CI now tests the checked-out source with read-only contents permission, no persisted credentials, no reconstruction, no commit/push step, and explicit pipefail. The four compressed transfer chunks are retired; gameplay sources are retained.

This cleanup is not merge approval. The NightSession implementation still overlaps the lifecycle work in PR #24 and the NightFlow variant merged via PR #25. Integrate office follow-ups and shared-context combat audio without retaining a second Night clock or home transition. The newly enabled gameplay browser test is required evidence, not presumed green.
