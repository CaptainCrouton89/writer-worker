# Modern AI System Prompts: Comprehensive Guide

## 1. Architectural Patterns

- **Hierarchical Structure**: Prompts progress from general (identity, purpose) to specific (rules, tool definitions).
  - Example: Identity → Capabilities → Operational Guidelines → Specific Rules → Function Definitions.
- **Modular Design**: Prompts are organized into modules (e.g., core identity, capabilities, operational, safety).
  - XML-style tags or markdown headers delineate sections.
- **XML-Style Semantic Markup**: Advanced prompts use XML-like tags for clear semantic separation.
- **Function-Based Agency**: Actions are defined as functions with formal parameter schemas (often JSON Schema), enabling precise, validated tool use.

## 2. Operational Frameworks

- **Agent Loops**: Iterative cycles for task completion (analyze events, select tools, execute, iterate, submit results, standby).
- **Decision Trees**: Conditional logic guides responses based on user input.
- **Event Stream Processing**: Chronological event streams (messages, actions, observations, plans, knowledge, data sources) maintain context.
- **Tool Use Frameworks**: Strict rules for tool invocation, validation, and user communication.
- **Error Recovery**: Structured error handling—verify, attempt fixes, try alternatives, report failures.

## 3. Communication & Interaction Models

- **Message Rules**: Immediate, brief acknowledgment of user input; use of notify (non-blocking) and ask (blocking) message types.
- **Interaction Models**: Distinction between notifications (no response needed) and questions (response required).
- **Information Presentation**: Detailed, prose-based writing by default; lists only if requested; source citation and file attachments for deliverables.
- **Conversation Management**: Event streams and planner modules maintain context and track progress.
- **Communication Patterns**: Function-based responses (tool calls), custom markup for code and file operations.

## 4. Domain Specialization

- **Software Development**: Code understanding, generation, debugging, and adherence to codebase conventions.
- **Web Development**: Best practices for responsive, accessible, performant web apps; React-specific guidelines.
- **Data Analysis**: Integration with authoritative data APIs, file-based data handling.
- **Content Creation**: Detailed, referenced, and structured writing; draft and compile workflow.
- **Deployment**: Rules for exposing services, public URLs, and user confirmation for production deployment.
- **Knowledge Modules**: Domain-specific best practices and knowledge provided as event stream items.

## 5. Safety and Alignment

- **Behavioral Constraints**: Explicit prohibitions (e.g., no account creation on social platforms, no bypassing CAPTCHAs, no illegal activities).
- **Content Moderation**: Filtering of harmful, illegal, or unethical content.
- **Tool Use Restrictions**: Only use explicitly provided tools; no fabrication or misuse.
- **Privacy Protection**: Minimal, purpose-specific use of personal information; no retention or sharing.
- **Transparency**: Disclosure of capabilities, limitations, and uncertainty.
- **Error Handling**: Structured recovery and user notification on failures.
- **Value Alignment**: Emphasis on helpfulness, harmlessness, and honesty.

## 6. Implementation Insights

- **Prompt Structure**: Use hierarchical, modular, and XML-style organization for clarity and maintainability.
- **Instruction Techniques**: Combine positive (what to do) and negative (what not to do) instructions; scenario-based guidance.
- **Function-Based Agency**: Define actions as functions with clear schemas and usage rules.
- **Context Management**: Use event streams and planner modules for multi-step, context-aware operation.
- **Error Handling**: Include robust mechanisms for error detection, recovery, and user communication.
- **Implementation Challenges**: Address prompt length and context window limits via modularity, conciseness, and prioritization; resolve instruction conflicts with explicit prioritization.

## Essential Code/Schema Example

```json
{
  "name": "message_notify_user",
  "parameters": {
    "text": "Message to display",
    "attachments": ["/path/to/file1", "/path/to/file2"]
  }
}
```

## Key Takeaways

- Modern AI prompts are structured, modular, and function-driven.
- Operational frameworks (agent loops, event streams) ensure robust, context-aware behavior.
- Communication models prioritize clarity, user experience, and actionable outputs.
- Domain specialization and safety mechanisms are integral for effective, responsible AI.
- Implementation requires careful structuring, clear instructions, and robust error/context management.
