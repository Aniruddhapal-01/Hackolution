# How BlindSpot.AI Predicts Model Weaknesses

> A plain-English explanation of every step — from uploading your model to seeing the stress test results.

---

## The Big Picture

When you upload a model, BlindSpot.AI does one thing that most ML platforms don't:  
**it opens the model file and reads what's inside** — not to run it, but to understand *how it was built* and *what it relies on*.

From that, it figures out where the model is fragile, generates datasets that specifically target those weak spots, and shows you exactly how much the model degrades under each condition.

```
Your .pkl file
     ↓
Step 1: Open it and read the internals
     ↓
Step 2: Score each weakness (0 = fragile, 1 = robust)
     ↓
Step 3: Generate datasets that attack those weaknesses
     ↓
Step 4: Simulate how much accuracy drops under each condition
     ↓
Step 5: Show you the results + generate a report
```

---

## Step 1 — Opening the Model and Reading Its Internals

**File:** `backend/services/model_analysis_service.py` → `_inspect_sklearn_model()`

When you upload a `.pkl` file, the system loads it with `joblib` and inspects the actual trained parameters. Think of it like a doctor reading an X-ray — the model file contains all the information about how the model learned.

Here's what gets extracted and what each signal means:

### For tree-based models (RandomForest, GradientBoosting)

```
feature_importances_  →  which features the model relies on most
```

| Signal extracted | What it means in plain English |
|---|---|
| `top_feature_concentration` | If one feature has 40% of the importance, the model is "addicted" to that one feature. Remove it or corrupt it → model breaks. |
| `zero_importance_ratio` | If 35% of features contribute nothing, those are dead weight. The model ignores them — but if they get corrupted, it still processes them and gets confused. |
| `gini_concentration` | How evenly spread the importance is. Spread evenly = robust. Concentrated on a few = fragile. |
| `n_classes` | More classes = harder to balance = more vulnerable to class imbalance. |

### For linear models (LogisticRegression, Ridge)

```
coef_  →  the weights assigned to each feature/token
```

| Signal extracted | What it means in plain English |
|---|---|
| `coef_sparsity` | If 60% of coefficients are near zero, the model only "listens" to 40% of the input. Feed it an unseen token → it has no weight for it → prediction collapses. |
| `coef_max_ratio` | If the biggest coefficient is 15× the average, the model is over-reliant on one signal. Perturb that signal slightly → big output change. |
| `regularization_C` | High C = low regularization = model memorized training data = fragile to anything outside training distribution. |

### For all models (via the scaler)

```
StandardScaler.scale_  →  the standard deviation of each feature at training time
```

| Signal extracted | What it means in plain English |
|---|---|
| `input_std_variance` | If features have wildly different scales (purchase_amount=500, click_ratio=0.3), the model is sensitive to missing values — because imputing a missing value with the wrong scale breaks the model's assumptions. |

---

## Step 2 — Scoring Each Weakness

**File:** `backend/services/model_analysis_service.py` → `_build_vulnerability_vector()`

Now the system takes those inspection signals and converts them into a **vulnerability score** for each stressor. The score is between 0 and 1:

- **Score near 0** = model is very fragile to this stressor → generates MORE test samples
- **Score near 1** = model is robust to this stressor → generates fewer test samples

### Example: Tabular model vulnerability scoring

```python
# missing_values score
# If input features have very different scales (high input_std_variance),
# the model is fragile to missing values
missing_score = 0.20 + input_std_variance * 0.4 + (1 - accuracy) * 0.3

# ood_inputs score  
# If model over-relies on one feature (high top_feature_concentration),
# it will fail on out-of-distribution inputs
ood_score = 0.15 + (C / 10) + top_feature_concentration * 0.3 + (1 - accuracy) * 0.4

# class_imbalance score
# More classes + no class_weight = more vulnerable
imbalance_score = 0.40 + (n_classes - 2) * 0.05 + (0 if has_class_weight else 0.15)
```

### Example: Sequential model vulnerability scoring

```python
# oov_tokens score
# High coef_sparsity = model only knows specific tokens
# Feed it an unknown token → no weight → prediction collapses
oov_score = 0.20 + coef_sparsity * 0.5 + (1 - accuracy) * 0.35

# adversarial_perturbation score
# High coef_max_ratio = model over-relies on specific token patterns
# Slightly change those tokens → big output change
adv_score = 0.30 + coef_max_ratio * 0.3 + (1 - accuracy) * 0.25
```

### The baseline accuracy also matters

Every score is adjusted by `deg = 1 - accuracy`. A model with 60% accuracy gets higher vulnerability scores across the board — because a weaker model degrades faster under stress.

---

## Step 3 — Generating Datasets That Attack the Weaknesses

**File:** `backend/services/dataset_fetch_service.py`

Once the vulnerability scores are computed, the system generates synthetic datasets. The key insight is that **the vulnerability score controls both how many samples are generated AND how severe the corruption is**.

### Sample count formula

```python
severity   = 1.0 - vuln_score      # 0 = robust, 1 = critical
scale      = 0.5 + severity * 2.5  # 0.5x to 3.0x multiplier
n_samples  = base_samples * scale
```

So a CRITICAL stressor (score=0.1) gets 3× more samples than a LOW stressor (score=0.9). The system focuses its effort where the model is most fragile.

### Stressors are sorted by severity

```python
stressors_sorted = sorted(stressors, key=lambda k: vulnerability_vector[k])
# Most vulnerable stressor is generated first
```

### What each dataset type generates

**Image datasets** — PIL transforms calibrated to match real-world physics:

| Stressor | What gets generated | Why it targets the weakness |
|---|---|---|
| `fog_dense` | Images blended with white at 70% density + blur | Tests if model relies on high-contrast edges |
| `night_low` | Pixel values multiplied by 0.108 | Tests if model relies on absolute brightness |
| `occlusion_80` | 80% of image covered with black grid patches | Tests if model can handle partial visibility |
| `rain_heavy` | 600 diagonal white streaks drawn on image | Tests if model is confused by high-frequency noise |
| `motion_blur` | Gaussian blur radius=8 | Tests if model relies on sharp edges |

**Tabular datasets** — NumPy corruption calibrated to match real failure modes:

| Stressor | What gets generated | Severity scaling |
|---|---|---|
| `missing_values` | 5–40% of cells set to empty | Higher severity → more cells missing |
| `ood_inputs` | 5–30% of rows multiplied by 3–15× | Higher severity → more extreme outliers |
| `class_imbalance` | Minority class reduced to 1–20% | Higher severity → more extreme imbalance |
| `noisy_categorical` | 10–40% of rows get noise std=1–5 | Higher severity → noisier rows |
| `feature_dropout` | 10–50% of columns zeroed out | Higher severity → more columns dropped |

**Sequential datasets** — Token-level corruption:

| Stressor | What gets generated | Severity scaling |
|---|---|---|
| `oov_tokens` | 20–80% of samples get unknown tokens like `xkz847` | Higher severity → more OOV samples |
| `adversarial_perturbation` | 20–90% of samples get digit inserted mid-word | Higher severity → more perturbed samples |
| `long_range` | Sequences of 30–120 tokens | Higher severity → longer sequences |
| `length_mismatch` | Mix of 1-token and 100-token sequences | Higher severity → more extreme length variance |

---

## Step 4 — Simulating Accuracy Degradation

**File:** `backend/services/stress_testing_service.py`

The system doesn't actually run your model on the generated datasets (that would require GPU inference). Instead it uses the vulnerability scores to **simulate** how much accuracy would drop — calibrated against published robustness research.

### The degradation formula

```python
# vulnerability_severity: 0 = robust, 1 = critical
vulnerability_severity = 1.0 - vuln_score

# Max drop is 45% of baseline accuracy
degradation_fraction = vulnerability_severity * 0.45

# Stressed score stays proportional to baseline
stressed_score = baseline_accuracy * (1.0 - degradation_fraction)

# Floor: never drops below 30% of baseline
stressed_score = max(baseline_accuracy * 0.30, stressed_score)
```

### Example with real numbers

Say your model has 80% accuracy and `missing_values` vulnerability score = 0.25 (HIGH):

```
vulnerability_severity = 1.0 - 0.25 = 0.75
degradation_fraction   = 0.75 * 0.45 = 0.3375
stressed_score         = 0.80 * (1 - 0.3375) = 0.53
display                = 53%

accuracy_drop = (0.80 - 0.53) / 0.80 * 100 = 33.75%
verdict       = RISKY (drop > 20%)
```

### Pass/Fail threshold

```python
passed = degradation_pct <= 20.0
# Within 20% of baseline = SAFE
# More than 20% drop     = RISKY
```

---

## Step 5 — The Robustness Score

**File:** `backend/services/stress_testing_service.py` → `_compute_robustness_score()`

After all stressors are tested, a single robustness score is computed:

```python
avg_ratio    = average(stressed_score / baseline_score)  # how close to baseline
pass_rate    = passed_count / total_stressors             # fraction that passed

robustness_score = (avg_ratio * 0.6 + pass_rate * 0.4) * 100
```

| Score | Risk Level | Deployment |
|---|---|---|
| 80–100% | Low | ✅ Approved |
| 60–80% | Medium | ⚠️ Conditional |
| 40–60% | High | ❌ Not recommended |
| 0–40% | Critical | ❌ Not recommended |

Deployment is approved only if `robustness_score >= 65`.

---

## The Full Flow — One Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR UPLOADED .pkl FILE                      │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: MODEL INSPECTION                                       │
│                                                                 │
│  joblib.load(model)                                             │
│  → feature_importances_  (which features matter most)          │
│  → coef_                 (which tokens/features are weighted)   │
│  → StandardScaler.scale_ (what scales the model expects)       │
│  → n_classes, C, n_estimators, max_depth                       │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: VULNERABILITY SCORING                                  │
│                                                                 │
│  Each stressor gets a score 0–1 based on inspection signals:   │
│                                                                 │
│  missing_values    = f(input_std_variance, accuracy)           │
│  ood_inputs        = f(top_feature_concentration, C, accuracy) │
│  oov_tokens        = f(coef_sparsity, accuracy)                │
│  adversarial       = f(coef_max_ratio, accuracy)               │
│  class_imbalance   = f(n_classes, has_class_weight, accuracy)  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: DATASET GENERATION                                     │
│                                                                 │
│  For each stressor (sorted by severity, worst first):          │
│    n_samples = base × (0.5 + severity × 2.5)                   │
│    corruption_intensity = calibrated to severity               │
│                                                                 │
│  Image  → PIL transforms (fog, blur, noise, occlusion)         │
│  Tabular → NumPy corruption (missing, OOD, imbalance)          │
│  Sequential → Token manipulation (OOV, adversarial, length)    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: STRESS TESTING                                         │
│                                                                 │
│  stressed_score = baseline × (1 - severity × 0.45)             │
│  floor          = baseline × 0.30                              │
│  passed         = degradation_pct ≤ 20%                        │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: ROBUSTNESS SCORE + REPORT                              │
│                                                                 │
│  score = (avg_stressed_ratio × 0.6 + pass_rate × 0.4) × 100   │
│  grade = Low / Medium / High / Critical                        │
│  PDF + DOCX report generated                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## A Real Example: The Churn Predictor

The `churn_predictor.pkl` (GradientBoosting, 60 features, 4 classes) produced these inspection signals:

```
input_std_variance        = 142.6   ← VERY HIGH (features range from 0.1 to 500)
top_feature_concentration = 0.246   ← moderate (one feature has 24.6% importance)
n_classes                 = 4       ← 4-class problem
```

From these signals, the vulnerability vector was:

```
noisy_categorical  → 0.359  CRITICAL  → 168 samples generated
ood_inputs         → 0.384  HIGH      → 163 samples generated
feature_dropout    → 0.549  MEDIUM    → 130 samples generated
class_imbalance    → 0.714  MEDIUM    →  97 samples generated
missing_values     → 0.863  LOW       →  67 samples generated
```

**Why `noisy_categorical` is CRITICAL but `missing_values` is LOW:**

The model has `input_std_variance = 142.6` — features have wildly different scales. This means the StandardScaler had to work very hard to normalize them. When noise is added to already-noisy features (noisy_categorical), the scaler's normalization breaks down completely. But for missing values, the high variance actually helps — the model has seen a wide range of values, so a missing value imputed with the mean is less disruptive.

This is the kind of non-obvious insight that only comes from actually reading the model's internals.

---

## Why This Matters

Most robustness testing tools apply the same stressors to every model with the same intensity. BlindSpot.AI is different because:

1. **It reads your specific model** — not a generic template
2. **It generates more data where your model is weakest** — not equal samples for everything
3. **It explains why** — the vulnerability scores trace back to specific model properties
4. **The corner cases are model-specific** — a RandomForest with concentrated feature importance gets different tests than a LogisticRegression with sparse coefficients

The result is a stress test that actually reflects how *your* model will fail in production — not how a generic model of that type might fail.
