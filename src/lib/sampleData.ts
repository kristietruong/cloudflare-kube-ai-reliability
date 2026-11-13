export type IncidentCategory =
  | 'CrashLoopBackOff'
  | 'OOMKilled'
  | 'ImagePullBackOff'
  | 'ErrImagePull'
  | 'PendingPods'
  | 'FailedScheduling'
  | 'NodeNotReady'
  | 'ProbeFailures'
  | 'PVCIssue'
  | 'ResourceExhaustion';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface SampleScenario {
  category: IncidentCategory;
  keywords: string[];
  resource: string;
  severity: Severity;
  symptomSummary: string;
  rootCause: string;
  evidence: string[];
  troubleshooting: string[];
  commands: string[];
  preventive: string[];
}

export const sampleScenarios: SampleScenario[] = [
  {
    category: 'CrashLoopBackOff',
    keywords: ['crashloopbackoff', 'back-off restarting failed container', 'restart count', 'restart loop'],
    resource: 'deployment/payment-service',
    severity: 'high',
    symptomSummary: 'Pods are repeatedly restarting and never reaching Ready state.',
    rootCause: 'The application exits immediately after startup, often because the process fails to start or the container is crashing due to a bad configuration or memory issue.',
    evidence: [
      'CrashLoopBackOff: back-off restarting failed container payment-service in 30s',
      'Container exited with code 137 after receiving a SIGKILL',
      'kubectl logs payment-service-... shows a traceback during configuration initialization'
    ],
    troubleshooting: [
      'Inspect the latest container logs to confirm the startup failure mode.',
      'Review the container command, environment variables, and volume mounts.',
      'Check whether the pod is hitting a memory limit or failing dependency health checks.'
    ],
    commands: [
      'kubectl get pod -l app=payment-service -n production',
      'kubectl describe pod payment-service-xxxxx -n production',
      'kubectl logs payment-service-xxxxx -n production --previous'
    ],
    preventive: [
      'Add a startupProbe and livenessProbe to fail fast with useful diagnostics.',
      'Validate application configuration in staging before rollout.',
      'Set memory and CPU requests/limits to realistic values.'
    ]
  },
  {
    category: 'OOMKilled',
    keywords: ['oomkilled', 'out of memory', 'killed due to memory', 'container exceeded its memory limit'],
    resource: 'statefulset/worker',
    severity: 'critical',
    symptomSummary: 'The container is being terminated after exceeding the configured memory limit.',
    rootCause: 'The workload is exhausting the memory limit because of unbounded concurrency, caching pressure, or a memory leak.',
    evidence: [
      'OOMKilled: Memory limit exceeded, container was terminated by the kernel',
      'The pod restarted after the node forced eviction of the resident memory set',
      'kubectl top pod shows memory near or above the limit for multiple replicas'
    ],
    troubleshooting: [
      'Compare memory usage against requests and limits using kubectl top and resource metrics.',
      'Inspect heap or object retention with the app runtime metrics and logs.',
      'Review recent traffic spikes and autoscaling thresholds.'
    ],
    commands: [
      'kubectl describe pod worker-0 -n production',
      'kubectl logs worker-0 -n production --previous',
      'kubectl top pod -n production --containers'
    ],
    preventive: [
      'Increase memory limits only after observing steady-state usage and identifying bottlenecks.',
      'Tune the application configuration for lower memory retention.',
      'Add alerts on memory saturation and pod restarts.'
    ]
  },
  {
    category: 'ImagePullBackOff',
    keywords: ['imagepullbackoff', 'pulling image', 'failed to pull image', 'invalid image name'],
    resource: 'deployment/api-gateway',
    severity: 'high',
    symptomSummary: 'The kubelet cannot pull the container image and the pod remains unscheduled or pending.',
    rootCause: 'The image reference is invalid, the registry is unavailable, or the image tag is missing and the pull fails.',
    evidence: [
      'Failed to pull image "registry.example.com/app:tag" from repository',
      'Back-off pulling image with ErrImagePull',
      'kubectl describe pod shows unauthorized or not found image errors'
    ],
    troubleshooting: [
      'Validate the container image name and tag against the registry.',
      'Verify registry credentials, VPC policy, and access permissions.',
      'Check whether the image is available in the target cluster namespace or region.'
    ],
    commands: [
      'kubectl describe pod api-gateway-xxxx -n production',
      'kubectl get events -n production --sort-by=.metadata.creationTimestamp',
      'kubectl get pods -A | grep ImagePullBackOff'
    ],
    preventive: [
      'Add image validation in CI and enforce immutable tags.',
      'Use private registry credentials bound to the correct namespace.',
      'Automate container registry health checks in deployment pipelines.'
    ]
  },
  {
    category: 'FailedScheduling',
    keywords: ['failed scheduling', '0/3 nodes are available', 'insufficient cpu', 'insufficient memory', 'pod did not deploy'],
    resource: 'deployment/analytics',
    severity: 'medium',
    symptomSummary: 'Pods are waiting because the cluster cannot place them onto a node with enough resources.',
    rootCause: 'The scheduler cannot find a node that satisfies the workload requests, affinity rules, or taints.',
    evidence: [
      '0/6 nodes are available: 6 Insufficient cpu',
      'Warning FailedScheduling pod cannot be scheduled on node due to taints',
      'Requests exceed the capacity of the currently available nodes'
    ],
    troubleshooting: [
      'Inspect pending pod conditions and scheduler events for resource constraints.',
      'Review node allocatable CPU/memory and taints or node affinity.',
      'Check for cluster autoscaler lag or misconfigured resource requests.'
    ],
    commands: [
      'kubectl get events -A --field-selector involvedObject.kind=Pod',
      'kubectl describe pod analytics-xxxx -n production',
      'kubectl get nodes -o wide'
    ],
    preventive: [
      'Adjust resource requests to the actual application requirements.',
      'Add node autoscaling or spread workloads across AZs.',
      'Review taints and tolerations for scheduler fit.'
    ]
  },
  {
    category: 'PendingPods',
    keywords: ['pending', 'containercreating', 'pod is pending', 'waiting to schedule'],
    resource: 'deployment/etl',
    severity: 'medium',
    symptomSummary: 'New pods remain in Pending state and never transition to Running.',
    rootCause: 'The workload is waiting for scheduling, image download, or PVC attachment in an unhealthy cluster state.',
    evidence: [
      'Pod has not started because image is still pulling',
      'Pending state persists for more than a few minutes',
      'Scheduler has not declared a placement decision yet'
    ],
    troubleshooting: [
      'Check the pod events and status to identify the exact pending condition.',
      'Review node availability and storage attachments.',
      'Verify the pod is not blocked on secret, config, or image pull requirements.'
    ],
    commands: [
      'kubectl get pod etl-xxxx -n production -o yaml',
      'kubectl describe pod etl-xxxx -n production',
      'kubectl get events -n production --sort-by=.metadata.creationTimestamp'
    ],
    preventive: [
      'Add a guardrail for image-pull timeouts and resource requests.',
      'Monitor pod scheduling latency as a reliability metric.',
      'Use readiness gates before rollout.'
    ]
  },
  {
    category: 'NodeNotReady',
    keywords: ['node notready', 'notready', 'node status is not ready', 'kubelet stopped posting ready'],
    resource: 'node/worker-3',
    severity: 'critical',
    symptomSummary: 'A Kubernetes node is failing readiness checks and no longer accepts workloads.',
    rootCause: 'Node-level health checks are failing because the kubelet is unhealthy, container runtime is broken, or networking is impaired.',
    evidence: [
      'Node worker-3 is NotReady: Kubelet stopped posting ready',
      'A failing container runtime or DNS outage blocks node registration',
      'Pods on the node are stuck in scheduling or container creation states'
    ],
    troubleshooting: [
      'Inspect the node conditions and recent kubelet logs for runtime errors.',
      'Verify that the container runtime and networking services are healthy.',
      'Check disk pressure and systemd unit health on the node.'
    ],
    commands: [
      'kubectl get nodes',
      'kubectl describe node worker-3',
      'journalctl -u kubelet -n 200'
    ],
    preventive: [
      'Set up node-level health alerts and dashboards.',
      'Run canary node rollouts and maintain OS patch compliance.',
      'Ensure cluster networking and DNS are redundant.'
    ]
  },
  {
    category: 'ProbeFailures',
    keywords: ['liveness probe failed', 'readiness probe failed', 'probe failed', 'unhealthy'],
    resource: 'deployment/auth',
    severity: 'high',
    symptomSummary: 'The workload is marked unhealthy and is being restarted or kept out of service.',
    rootCause: 'The application is not responding successfully to health probes or is taking too long to become ready.',
    evidence: [
      'Liveness probe failed: HTTP probe responded with status code 500',
      'Readiness probe failed after 5s, pod remains unready',
      'A container restart loop matches repeated probe failures'
    ],
    troubleshooting: [
      'Validate the application health endpoint and response latency.',
      'Review readiness and liveness timings for false positives.',
      'Check service dependencies that may be required during startup.'
    ],
    commands: [
      'kubectl describe pod auth-xxxx -n production',
      'kubectl logs auth-xxxx -n production --previous',
      'kubectl get endpoints -n production'
    ],
    preventive: [
      'Keep startup probes realistic for cold starts and dependency spin-ups.',
      'Monitor application readiness latency and endpoint health.',
      'Avoid a probe path that requires a slow external dependency.'
    ]
  },
  {
    category: 'PVCIssue',
    keywords: ['persistentvolumeclaim', 'bound', 'mount failed', 'volume', 'pvc', 'mountvolume'],
    resource: 'statefulset/db',
    severity: 'critical',
    symptomSummary: 'The workload cannot mount or retain its persistent data volume.',
    rootCause: 'The PVC is pending, the storage class is unavailable, or the volume cannot be mounted to the pod.',
    evidence: [
      'persistentvolumeclaim is pending',
      'MountVolume.SetUp failed for volume "data" : no volume plugin matched',
      'StorageClass not found for the requested claim'
    ],
    troubleshooting: [
      'Check whether the PVC is bound to a suitable storage class.',
      'Inspect the PV availability and node access paths.',
      'Verify the volume size and permissions match the workload requirements.'
    ],
    commands: [
      'kubectl get pvc -A',
      'kubectl describe pvc db-data -n production',
      'kubectl get pv'
    ],
    preventive: [
      'Create storage classes explicitly and validate them in staging.',
      'Monitor reclaim policy and volume capacity before rollout.',
      'Ensure snapshots and backups are configured for persistence-critical workloads.'
    ]
  },
  {
    category: 'ResourceExhaustion',
    keywords: ['cpu throttling', 'memory pressure', 'resource exhausted', 'high cpu usage', 'exhausted'],
    resource: 'deployment/search',
    severity: 'high',
    symptomSummary: 'The workload is saturating CPU or memory and causing latency or evictions.',
    rootCause: 'The cluster is under-provisioned or the workload is using more resources than planned, causing contention.',
    evidence: [
      'node experiencing high CPU load and memory pressure',
      'pod remains throttled due to exceeded limits',
      'Metrics show sustained saturation over multiple evaluation windows'
    ],
    troubleshooting: [
      'Review workload CPU and memory utilization against limits and reservations.',
      'Check for recent load spikes or bursty batch jobs.',
      'Evaluate whether vertical or horizontal scaling is required.'
    ],
    commands: [
      'kubectl top nodes',
      'kubectl top pod -n production --containers',
      'kubectl describe hpa search -n production'
    ],
    preventive: [
      'Set alerting on sustained resource saturation.',
      'Tune HPA and VPA to match workload profile.',
      'Use burst budgets and workload isolation to protect critical services.'
    ]
  }
];
