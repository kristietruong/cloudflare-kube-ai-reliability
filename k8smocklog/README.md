# Kubernetes log analysis samples

These `.log` files are intended for the dashboard's **Analyze File** flow. They contain demonstration data, not live cluster output. Select a file and analyze it directly; it is sent to the Worker for that request only and is not stored in R2 or on disk.

## GitHub examples

- `checkout-svc.log` is from [anthropics/claude-cookbooks](https://github.com/anthropics/claude-cookbooks/blob/ce8b2629efe8b24048b127b4c79af1e9cbab93d4/managed_agents/example_data/sre/logs/checkout-svc.log). The repository is MIT-licensed; see its [LICENSE](https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE). It demonstrates memory pressure, OOMKilled, and CrashLoopBackOff.
- `incident_story.log` is from [dloss/kelora](https://github.com/dloss/kelora/blob/f535dc02576e8df21c2d0b7720cd872aef2092e8/examples/incident_story.log). The repository is MIT-licensed; see its [LICENSE](https://github.com/dloss/kelora/blob/main/LICENSE). It demonstrates pod restart and image-pull events.
- Copies of both upstream MIT license notices are included in this folder.

## Local demonstration samples

- `imagepullbackoff-api.log`: invalid image tag and ImagePullBackOff.
- `failed-scheduling-analytics.log`: insufficient CPU/memory and node affinity.
- `pvc-pending-db.log`: missing storage class and unbound PVC.
- `probe-failure-auth.log`: readiness and liveness probe failures.

To try one, select a `.log` file in the dashboard and click **Analyze File**.
