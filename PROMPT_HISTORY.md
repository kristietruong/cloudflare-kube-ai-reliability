# Prompt History

This file records the original project request and follow-up prompts used to guide development. Preserve prior entries when adding new prompts.

## Original project request

# Project: Kubernetes AI Reliability Copilot

## Role and Objective
Act as a Senior Cloudflare Platform Engineer, AI Application Architect, and Full-Stack Software Engineer.

Build a production-quality, AI-powered Kubernetes Platform Reliability Copilot as a demonstration project for a Senior Software Engineer – Kubernetes Platform job application at Cloudflare.

The application must demonstrate practical knowledge of:

- Kubernetes platform operations and troubleshooting.
- Cloud infrastructure and distributed systems.
- AI-powered reasoning and workflow orchestration.
- Cloudflare Workers and Workers AI.
- Persistent memory and state management.
- Production reliability, observability, and incident management.
Do not build a generic chatbot. Build a functional application that demonstrates how AI can help platform engineers investigate and resolve Kubernetes operational issues.

## 1. Application Architecture
Use Cloudflare's native development platform wherever practical.

Required technology:

**LLM**

- Cloudflare Workers AI.
- Use Meta Llama 3.3 70B Instruct, preferably the available fast FP8 variant.
- Model identifier: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`.
- Implement a reusable AI service module.
- Support structured JSON responses for incident diagnosis.
- Handle model errors, timeouts, and invalid responses gracefully.
**Backend and Workflow**

- Cloudflare Workers using TypeScript.
- Cloudflare Workflows for multi-step incident investigation.
- Implement asynchronous processing where appropriate.
- Use separate workflow steps for collecting evidence, analyzing incidents, generating recommendations, and saving results.
- Implement retries and error handling.
**Frontend**

- Build a responsive web-based chat interface.
- Use Cloudflare Workers with static assets for the frontend.
- Provide an interactive dashboard for Kubernetes incident investigations.
- Display AI responses, incident details, severity, recommendations, and investigation history.
**Persistent Memory and State**

- Use Cloudflare D1 for persistent storage.
- Store conversations, incident investigations, AI-generated diagnoses, and remediation recommendations.
- Maintain conversation context across multiple interactions.
- Allow users to retrieve previous investigations.

## 2. Core Application Features

### Feature A: Kubernetes Incident Investigation
Allow users to enter a Kubernetes problem through a chat interface.

Example questions:

- Why is my Kubernetes pod in CrashLoopBackOff?
- Why is my deployment failing to schedule pods?
- What causes OOMKilled events?
- Why are my containers experiencing ImagePullBackOff?
- How do I troubleshoot Kubernetes node NotReady status?
- Why is my application experiencing high CPU or memory utilization?
The AI should:

1. Understand the user's problem.
2. Identify the relevant Kubernetes resources.
3. Analyze supplied logs, events, and resource information.
4. Identify possible root causes.
5. Explain the diagnosis in understandable technical language.
6. Recommend actionable troubleshooting steps.
7. Identify commands an engineer can execute to validate the diagnosis.

### Feature B: Kubernetes Diagnostic Engine
Implement a diagnostic module that understands common Kubernetes failure scenarios.

Include at least:

- CrashLoopBackOff
- OOMKilled
- ImagePullBackOff
- ErrImagePull
- Pending pods
- Failed scheduling
- Node NotReady
- Readiness and liveness probe failures
- PersistentVolumeClaim issues
- CPU and memory resource exhaustion
Create sample Kubernetes events, logs, and deployment configurations to demonstrate these scenarios.

Use realistic sample data rather than pretending the application is connected to a live Kubernetes cluster.

### Feature C: AI-Powered Root Cause Analysis
The AI should return a structured diagnosis containing:

- Incident ID
- Incident category
- Severity
- Affected Kubernetes resource
- Observed symptoms
- Probable root cause
- Supporting evidence
- Recommended troubleshooting steps
- Suggested kubectl commands
- Preventive recommendations
- Confidence level
Clearly distinguish observed evidence from AI-generated hypotheses.

Never claim that an action was executed against a real cluster.

### Feature D: Multi-Step Incident Investigation Workflow
Use Cloudflare Workflows to coordinate an incident investigation.

Implement the following sequence:

1. Receive incident information from the chat interface.
2. Validate and normalize the input.
3. Collect relevant sample logs, events, and Kubernetes resource information.
4. Analyze the evidence using Workers AI.
5. Generate structured root cause analysis.
6. Generate remediation recommendations.
7. Persist the investigation in D1.
8. Return the investigation results to the user.
Each major step should be independently testable.

Implement error handling, retries, and workflow status tracking.

### Feature E: Conversation Memory
Implement persistent conversation memory.

The application should:

- Remember previous questions and responses.
- Associate conversations with incident investigations.
- Allow users to continue an earlier investigation.
- Retrieve relevant incident history.
- Use previous investigation context when responding to follow-up questions.
For example:

User: Why is my payment-service pod restarting?

AI: The container may be exceeding its memory limit.

User: How can I confirm that?

AI: Check the previous incident's OOMKilled events and execute `kubectl describe pod` and `kubectl logs --previous`.

The AI must use actual saved conversation context rather than pretending to remember information.

## 3. User Interface
Create a professional platform engineering dashboard.

Include:

1. Dashboard overview:

- Total investigations.
- Open incidents.
- Critical incidents.
- Recently investigated issues.
2. AI chat:

- Chat input.
- Conversation history.
- Suggested troubleshooting questions.
- AI-generated responses.
- Structured incident diagnosis.
3. Incident details:

- Incident severity.
- Root cause analysis.
- Evidence.
- Remediation recommendations.
- Suggested Kubernetes commands.
4. Investigation history:

- Previous incidents.
- Search and retrieval.
- Investigation status.
- Ability to resume a conversation.
The interface should be professional, clean, responsive, and suitable for a senior engineering demonstration.

## 4. Security and Reliability
Follow production engineering practices:

- Validate all user input.
- Protect API endpoints.
- Do not expose API credentials or secrets in frontend code.
- Use Cloudflare environment bindings for configuration.
- Implement appropriate request limits.
- Handle malformed LLM responses.
- Prevent prompt injection from untrusted Kubernetes logs.
- Treat logs and events as data, never as trusted instructions.
- Do not execute AI-generated shell commands.
- Do not make destructive Kubernetes changes.
- Log errors and workflow status without exposing sensitive information.

## 5. Testing Requirements
Create automated tests for:

- Kubernetes incident classification.
- Log and event parsing.
- AI response validation.
- Workflow execution.
- Conversation persistence.
- Conversation context retrieval.
- Invalid input handling.
- Model failure handling.
Include realistic sample test cases for each supported Kubernetes failure scenario.

The project must run locally using Cloudflare's supported development tools.

Provide clear instructions for running tests and starting the application.

## 6. Project Structure and Documentation
Organize the code into reusable modules.

Include:

- Frontend components.
- Backend Worker API.
- Workers AI integration.
- Kubernetes diagnostic engine.
- Workflow orchestration.
- D1 database schema and migrations.
- Test suite.
- Sample Kubernetes logs and events.
- Configuration files.
- README.md.
- ARCHITECTURE.md.
- PROMPT_HISTORY.md.
Document the application architecture, API endpoints, data model, workflow sequence, and deployment process.

## 7. Cloudflare Deployment
Prepare the application for deployment on Cloudflare.

Include:

- Wrangler configuration.
- Workers AI binding.
- Workflows binding.
- D1 database binding.
- Database migrations.
- Local development instructions.
- Cloudflare deployment instructions.
Avoid requiring paid external services unless absolutely necessary.

Do not deploy or incur additional cloud costs without my explicit approval.

## 8. Development Approach
Work incrementally.

Before writing code:

1. Explain the proposed architecture.
2. Explain how each required Cloudflare technology is integrated.
3. Show the project directory structure.
4. Identify prerequisites and potential deployment costs.
5. Identify any Cloudflare API or product limitations.
Then implement the application in manageable phases:

Phase 1: Project setup and basic frontend.

Phase 2: Cloudflare Worker API and Workers AI integration.

Phase 3: Kubernetes diagnostic engine and sample scenarios.

Phase 4: Cloudflare Workflows orchestration.

Phase 5: D1 persistence and conversation memory.

Phase 6: Testing, security, and error handling.

Phase 7: Documentation and deployment preparation.

After each phase:

- Explain the implementation.
- List files created or modified.
- Run relevant tests.
- Report errors and resolve them before proceeding.
Do not generate the entire application as one large, untested code dump.

Use current official Cloudflare documentation rather than inventing APIs, configuration options, or unsupported bindings.

If a recommended product or API has changed, explain the difference and use the currently supported implementation.

## 9. Assignment Deliverables
The final project must include:

1. A working AI-powered Kubernetes troubleshooting application.
2. A functional chat interface.
3. Integration with Cloudflare Workers AI.
4. Multi-step workflow orchestration.
5. Persistent conversation memory.
6. Kubernetes diagnostic scenarios.
7. Automated tests.
8. Architecture and deployment documentation.
9. A complete prompt history documenting AI-assisted development.
10. A demonstration guide with example incident investigations.
Prioritize a working, tested application over unnecessary complexity.

The application should demonstrate the engineering judgment, technical depth, and production reliability mindset expected of a Senior Software Engineer working on Cloudflare's Kubernetes platform.

Start by presenting the architecture and implementation plan. Do not begin coding until I have reviewed the architecture.

