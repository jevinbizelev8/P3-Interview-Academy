# AGENT_CLI_REGISTRY.md
**Purpose:**  
Central reference for all CLI tools available to the Agent Orchestrator.  
Claude Code, Codex, Gemini, and other AI agents can use this registry to plan, route, and execute development tasks.

---

## 📘 Structure
Each entry follows this schema:
```yaml
- name: <string>              # CLI command name
  category: <string>          # ai | infra | ci | security | doc | testing | utility
  description: <string>       # what it does
  strengths: [<string>]       # common task types
  example: <string>           # sample command usage
```

---

## 🧠 AI / MODEL CLIs

```yaml
- name: claude_code
  category: ai
  description: "Anthropic's Claude CLI for code understanding, repo edits, and reasoning."
  strengths: ["refactor", "multi-file edit", "test repair", "explain code"]
  example: "claude prompt --stdin < task.json"

- name: codex
  category: ai
  description: "OpenAI's Codex CLI for targeted code generation and automation."
  strengths: ["function generation", "SDK stubs", "code snippets"]
  example: "codex gen --stdin < task.json"

- name: gemini
  category: ai
  description: "Google's Gemini CLI for planning, documentation, and structured outputs."
  strengths: ["planning", "documentation", "architecture design"]
  example: "gemini prompt --stdin < plan.txt"

- name: openai
  category: ai
  description: "OpenAI CLI for chat, completions, embeddings, and fine-tuning."
  strengths: ["text generation", "model evaluation", "embeddings"]
  example: "openai api chat.completions.create -m gpt-4o -i prompt.txt"

- name: ollama
  category: ai
  description: "Local LLM runner for open-source models (Llama3, Mistral, Phi)."
  strengths: ["offline inference", "private data processing"]
  example: "ollama run llama3 'summarize.py'"
```

---

## ☁️ CLOUD / INFRA CLIs

```yaml
- name: aws
  category: infra
  description: "AWS CLI for managing services, EC2, Lambda, S3, and Elastic Beanstalk."
  strengths: ["deployment", "config", "secrets management"]
  example: "aws elasticbeanstalk update-environment --application-name app --environment-name staging"

- name: gcloud
  category: infra
  description: "Google Cloud CLI for Vertex AI, Cloud Run, and infrastructure operations."
  strengths: ["model deployment", "GCP operations", "auth setup"]
  example: "gcloud run deploy api-service --source ."

- name: az
  category: infra
  description: "Azure CLI for multi-cloud deployment and VM management."
  strengths: ["resource provisioning", "cloud ops"]
  example: "az deployment group create --template-file main.bicep"

- name: terraform
  category: infra
  description: "Infrastructure-as-code tool for provisioning and validating cloud environments."
  strengths: ["infrastructure planning", "apply/destroy"]
  example: "terraform init && terraform plan"

- name: docker
  category: infra
  description: "Containerization CLI for build, run, and image management."
  strengths: ["container build", "registry push", "runtime ops"]
  example: "docker build -t myapp:latest . && docker push myapp:latest"

- name: kubectl
  category: infra
  description: "Kubernetes CLI for managing clusters and deployments."
  strengths: ["cluster management", "rollouts", "logs"]
  example: "kubectl apply -f deployment.yaml"
```

---

## ⚙️ DEVOPS / CI-CD CLIs

```yaml
- name: gh
  category: ci
  description: "GitHub CLI for workflows, PRs, releases, and issue automation."
  strengths: ["PR management", "workflow runs", "release automation"]
  example: "gh workflow run deploy.yml"

- name: act
  category: ci
  description: "Local runner for GitHub Actions workflows."
  strengths: ["local CI test", "debug automation"]
  example: "act -j build"

- name: vercel
  category: ci
  description: "Vercel CLI for frontend and documentation deployment."
  strengths: ["static site deploy", "frontend previews"]
  example: "vercel deploy --prod"

- name: netlify
  category: ci
  description: "Netlify CLI for continuous deployment and build previews."
  strengths: ["web deploy", "site builds"]
  example: "netlify deploy --dir=dist"

- name: npm
  category: ci
  description: "Node package manager CLI."
  strengths: ["build", "test", "lint"]
  example: "npm run lint && npm test"

- name: pytest
  category: ci
  description: "Python test runner."
  strengths: ["unit testing", "coverage reports"]
  example: "pytest -q"
```

---

## 🧪 TESTING / OBSERVABILITY CLIs

```yaml
- name: curl
  category: testing
  description: "HTTP client for smoke testing and API calls."
  strengths: ["health checks", "API validation"]
  example: "curl -fsS https://staging.api/health"

- name: httpie
  category: testing
  description: "Human-friendly HTTP CLI for debugging APIs."
  strengths: ["REST testing", "API auth"]
  example: "http GET https://api.example.com/status"

- name: newman
  category: testing
  description: "Postman CLI for automated API test collections."
  strengths: ["integration testing", "CI validation"]
  example: "newman run tests/postman_collection.json"

- name: k6
  category: testing
  description: "Load testing CLI for performance checks."
  strengths: ["load testing", "performance metrics"]
  example: "k6 run load-test.js"

- name: lighthouse
  category: testing
  description: "Web performance and accessibility audit CLI."
  strengths: ["web audit", "SEO metrics"]
  example: "lighthouse https://your-site.com --output json"
```

---

## 🔒 SECURITY / COMPLIANCE CLIs

```yaml
- name: trivy
  category: security
  description: "Container and dependency vulnerability scanner."
  strengths: ["security scan", "CI compliance"]
  example: "trivy fs ."

- name: bandit
  category: security
  description: "Python static security analysis."
  strengths: ["vulnerability check", "linting"]
  example: "bandit -r src/"

- name: semgrep
  category: security
  description: "Static code analysis for multiple languages."
  strengths: ["code scanning", "policy enforcement"]
  example: "semgrep --config auto"

- name: snyk
  category: security
  description: "Dependency vulnerability scanner."
  strengths: ["dependency scan", "CVE detection"]
  example: "snyk test"
```

---

## 🧾 DOCUMENTATION / UTILITIES

```yaml
- name: mkdocs
  category: doc
  description: "Static site generator for project documentation."
  strengths: ["docs build", "auto versioning"]
  example: "mkdocs build"

- name: pandoc
  category: doc
  description: "Document converter between Markdown, PDF, and Word."
  strengths: ["format conversion", "export automation"]
  example: "pandoc README.md -o README.pdf"

- name: jq
  category: utility
  description: "Command-line JSON processor."
  strengths: ["parse", "filter", "transform JSON"]
  example: "jq '.tasks[] | .title' orchestrator.json"

- name: yq
  category: utility
  description: "YAML processor compatible with jq syntax."
  strengths: ["parse", "filter", "transform YAML"]
  example: "yq '.routing.rules' orchestrator.config.yaml"

- name: task
  category: utility
  description: "Declarative task runner similar to make."
  strengths: ["automation", "build pipelines"]
  example: "task deploy"

- name: fzf
  category: utility
  description: "Interactive fuzzy finder for shell use."
  strengths: ["selection UI", "interactive filtering"]
  example: "ls | fzf"
```

---

## 💬 COLLABORATION / NOTIFICATION CLIs

```yaml
- name: slack
  category: collaboration
  description: "Slack CLI for posting messages and alerts."
  strengths: ["notifications", "team approvals"]
  example: "slack chat send --channel devops --text 'Deploy complete ✅'"

- name: discord
  category: collaboration
  description: "Discord CLI for posting notifications to channels."
  strengths: ["alerts", "status updates"]
  example: "discord send --webhook $DISCORD_WEBHOOK_URL --message 'Build passed.'"
```

---

## 🧭 ROUTING HINTS (Used by Orchestrator)

| Task Pattern | Preferred CLIs |
|---------------|----------------|
| planning / ADR / documentation | `gemini`, `claude_code` |
| function / stub / SDK generation | `codex`, `openai` |
| refactor / multi-file edits | `claude_code` |
| deploy / infra / secrets | `aws`, `terraform`, `docker` |
| smoke / health check | `curl`, `httpie` |
| load / integration test | `newman`, `k6` |
| security / scan | `trivy`, `bandit`, `semgrep` |
| docs / export | `mkdocs`, `pandoc` |
| collaboration / notification | `slack`, `gh`, `discord` |

---

**Last updated:** 2025-10-29  
**Maintainer:** Handsome — AI Engineer  
**Project:** Agent Orchestrator
