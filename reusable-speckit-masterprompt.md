\# SpecKit Lean Feature Request



\*\*Instructions\*\*: Use this template for quick iterations and UI refinements while maintaining SpecKit compliance.



---

I want you to implement this change in our SpecKit project.



\## 1. Request

\- \*\*Change\*\*: \[describe desired behavior]

\- \*\*Why\*\*: \[business/user intent]

\- \*\*Non-goals\*\*: \[what must not change]



\## 2. Expected Behavior (Required)

\- \*\*Scenario 1\*\*: \[Given / When / Then]

\- \*\*Scenario 2\*\*: \[Given / When / Then]

\- \*\*Scenario 3\*\*: \[Given / When / Then]



\## 3. Workflow Preference

\- \*\*Mode\*\*: \[AUTO / LIGHTWEIGHT / FULL]

&nbsp;   - \*AUTO\*: Assistant decides the most professional path.

&nbsp;   - \*LIGHTWEIGHT\*: Spec delta + TDD + Implementation.

&nbsp;   - \*FULL\*: Plan -> Tasks -> Analyze -> Implement.



\## 4. Quality Constraints

\- \*\*TDD required\*\*: Yes

\- \*\*Coverage minimum\*\*: Statements >= 80%, Lines >= 80%

\- \*\*Rule\*\*: Do not relax gates without explicit approval.



\## 5. Guardrail Instructions (Mandatory)

1\. \*\*Verification\*\*: Before coding, check all relevant SpecKit artifacts: `spec.md`, `plan.md` (if needed), `tasks.md`, checklists, and ADR impact.

2\. \*\*Professional Veto\*\*: If the requested mode is not the professionally correct SpecKit workflow for this change, \*\*stop\*\*, explain why, and ask for confirmation.

3\. \*\*Clarification\*\*: Ask clarifying questions if behavior (especially Auth/Route boundaries) is ambiguous.

4\. \*\*Synchronization\*\*: After implementation, update only necessary spec/checklist/traceability files and report exactly what changed.

5\. \*\*Evidence\*\*: Provide validation commands run and pass/fail evidence.

