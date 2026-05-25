# Agent Ascension State (I/O Coherence Template)

> [!IMPORTANT]
> **Pre-flight Circuit Breaker**: Before writing any code or modifying files, the agent must evaluate the clarity, completeness, and context of your request to calculate the **Input Quality Score (IQS)**.
> **If IQS < 7.0/10, the agent must halt immediately and request explicit clarification on the missing parameters.**

| Field | Value |
|-------|--------|
| **task** | [Single sentence description] |
| **started** | YYYY-MM-DD |
| **iteration** | 0 |
| **bar_version** | v1 |
| **best_score** | — |
| **blockers** | [Active blocker list or None] |

---

## 🧭 Pre-flight Input Quality Score (IQS Rubric)

Before execution, evaluate the request across these 4 dimensions:
1. **Clarity (30%)**: Free of conflicting goals or ambiguous instructions.
2. **Context Completeness (30%)**: All relevant file paths, variables, and boundaries are specified.
3. **Verification Criteria (20%)**: Testable definitions of success are clear (not vague).
4. **Edge Case Coverage (20%)**: Specifications exist for timeouts, network/DB failures, or errors.

**IQS Pre-flight Score**: `[X.X] / 10`  
*State: PASS (IQS >= 7.0) / HALT (IQS < 7.0)*

---

## 🎯 Acceptance Criteria (bar v1)

1. [Criterion 1 with testable check]
2. [Criterion 2 with testable check]
3. [Criterion 3 with testable check]

## 🛡️ Regression Guards (Must Stay Green)

- `npm test` passes cleanly.
- `npm run build` compiles with zero warnings.
- All new features verified in local or contract test suites.

---

## 📊 Coherence & Score History

On every iteration, calculate the **Input Quality Score (IQS)**, the **Output Quality Score (OQS)** via the 7-dimension weighted rubric, and the **Fidelity Delta (Δ)**:
$$\text{Fidelity Delta } (\Delta) = \text{OQS} - \text{IQS}$$

* $\Delta \approx 0$: Perfect transmission.
* $\Delta > 0$: Creative recovery (handled ambiguous inputs with codebase research).
* $\Delta < 0$: **System Failure Alert** (agent failed to execute clear instructions; stop and inspect).

| iter | bar | IQS (Input) | OQS (Output) | Fidelity Delta (Δ) | Correctness (30%) | Complete (20%) | Robust (15%) | Clarity (10%) | Perf/Sec (10%) | Elegance (5%) | Compound (10%) | **Weighted Total** | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | v1 | | | | | | | | | | | | |

---

## 📝 Iteration Log

### Iteration 0 @ bar v1
- **Input Score (IQS) Analysis**: [Explain reasons for the IQS score]
- **Output Score (OQS) Analysis**: [Explain reasons for the OQS score]
- **Verification Command & Output**: [Brief test commands executed and results]
- **Decision**: [REPAIR (if weighted < 8.5) / PASS / RAISE BAR]
- **Durable Lesson**: [Durable engineering rule to log to the global AGENT_HARMONY_LEDGER.md]
- **Files Touched**: [Files list with relative paths]
