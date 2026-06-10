"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "all" | "conditions" | "remedies" | "technology";

interface Reference {
  label: string;
  url:   string;
}

interface PostSection {
  heading?:   string;
  paragraphs?: string[];
  bullets?:   string[];
}

interface Post {
  id:         string;
  title:      string;
  category:   Exclude<Category, "all">;
  emoji:      string;
  readTime:   string;
  excerpt:    string;
  sections:   PostSection[];
  references: Reference[];
}

// ─── Category meta ────────────────────────────────────────────────────────────

const CAT_META: Record<Exclude<Category, "all">, { label: string; color: string; bg: string; dot: string }> = {
  conditions: {
    label: "Understanding the Conditions",
    color: "text-violet-700",
    bg:    "bg-violet-100",
    dot:   "bg-violet-400",
  },
  remedies: {
    label: "Evidence-Based Natural Remedies",
    color: "text-emerald-700",
    bg:    "bg-emerald-100",
    dot:   "bg-emerald-400",
  },
  technology: {
    label: "Technology, Privacy & AI",
    color: "text-sky-700",
    bg:    "bg-sky-100",
    dot:   "bg-sky-400",
  },
};

// ─── Posts ────────────────────────────────────────────────────────────────────

const POSTS: Post[] = [
  // ── CATEGORY 1: Understanding the Conditions ─────────────────────────────
  {
    id:            "diagnosis-delay",
    title:         "The 7–10 Year Wait: Why Diagnosis Takes So Long",
    category:      "conditions",
    emoji:         "⏳",
    readTime:      "4 min read",
    excerpt:
      "For many women, diagnosis is not delayed because the symptoms are minor — it is delayed because the healthcare path is fragmented, pain is normalised, and symptoms are spread across multiple specialties.",
    sections: [
      {
        paragraphs: [
          "For many women, diagnosis is not delayed because the symptoms are minor, but because the healthcare path is fragmented. Pain is normalized, irregular bleeding is dismissed, symptoms are spread across gynecology, endocrinology, gastroenterology, dermatology, and primary care, and patients are often left to connect the dots themselves.",
          "In endometriosis, this delay has been widely described as lasting roughly 7 to 10 years from symptom onset to diagnosis, while PCOS also often involves years of uncertainty, repeated consultations, and incomplete investigation before a person receives a clear explanation for what is happening.",
        ],
      },
      {
        heading: "Why diagnosis takes so long",
        paragraphs: [
          "One reason is that endometriosis still lacks a simple, widely used non-invasive diagnostic standard. Laparoscopy has historically been treated as a reference method, which means many patients spend years being managed symptomatically before more definitive evaluation is considered.",
          "Another reason is symptom heterogeneity. Endometriosis does not always present as 'classic' menstrual pain, and PCOS does not always present with obvious obesity or the same hormonal profile in every patient. This creates blind spots, especially for people with mixed symptoms, milder symptoms, or phenotypes that do not match common assumptions.",
          "A third problem is data fragmentation. Many apps and consultations capture only isolated snapshots: a bad period, one ultrasound, one blood test, one month of tracking, one clinic note. But chronic conditions reveal themselves through patterns across time, not just isolated episodes.",
        ],
      },
      {
        heading: "The research bottleneck",
        paragraphs: [
          "There is also a broader research bottleneck behind the clinical one. When data is inconsistent, sparse, or poorly structured, researchers struggle to build models that are both accurate and generalizable, and clinicians struggle to translate research findings into earlier detection pathways.",
          "In endometriosis, Goldstein and Cohen showed that self-reported symptoms alone can be highly predictive when the right symptom set is collected. Their work suggests the issue is not only whether data exists, but whether the correct data is being captured in a structured and clinically relevant way.",
        ],
      },
      {
        heading: "How structured tracking can shorten the window",
        paragraphs: [
          "Structured tracking helps turn vague suffering into a pattern that can be seen, reviewed, and discussed. Instead of telling a clinician 'I feel bad sometimes,' a user can show when the pain began, whether it worsens around menstruation, whether bowel symptoms track with cramps, how often fatigue interferes with work, and how cycle irregularity changes over months.",
          "That kind of diary is useful for two reasons. First, it supports better clinical conversations. Second, it creates a longitudinal dataset that can eventually help machine learning systems detect symptom clusters earlier than traditional trial-and-error care often does.",
          "A good women's health app should not stop at cycle counting. It should support multi-dimensional symptom capture, severity ratings, trends over time, and transparent explanations of how insights are generated — especially if it uses machine learning. The goal is not to replace doctors, but to reduce the years lost between first symptoms and informed care.",
        ],
      },
    ],
    references: [
      { label: "Goldstein & Cohen (2023) — Scientific Reports", url: "https://doi.org/10.1038/s41598-023-32761-8" },
      { label: "Fruchart et al. (2023) — Digital Health", url: "https://doi.org/10.1177/20552076231176114" },
      { label: "Zad et al. (2024) — Frontiers in Endocrinology", url: "https://doi.org/10.3389/fendo.2024.1298628" },
      { label: "ONS (2024) — Endometriosis in England", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/healthandsocialcare/healthinequalities/bulletins/characteristicsofwomenwithanendometriosisdiagnosisinengland/latest" },
      { label: "EDPB Guidelines 01/2025 — Pseudonymisation", url: "https://www.edpb.europa.eu/our-work-tools/documents/public-consultations/2025/guidelines-012025-pseudonymisation_en" },
    ],
  },

  {
    id:            "endo-vs-pcos",
    title:         "Endometriosis vs. PCOS: Shared Symptoms, Different Paths",
    category:      "conditions",
    emoji:         "🔬",
    readTime:      "5 min read",
    excerpt:
      "Irregular periods, pelvic pain, fatigue, and mood changes can appear in both endometriosis and PCOS — yet the two conditions arise from entirely different biological processes. Understanding the distinction matters for care.",
    sections: [
      {
        paragraphs: [
          "For many women, the journey toward a diagnosis begins with a confusing set of symptoms that seem to point in several directions at once. Irregular periods, pelvic pain, bloating, fatigue, acne, fertility struggles, and mood changes can appear in both endometriosis and PCOS, which is one reason these conditions are so often misunderstood or mixed up in early care conversations.",
          "Although both conditions are common in reproductive-age women, they do not arise from the same biological process. Endometriosis is mainly understood as an estrogen-dependent inflammatory disease in which tissue similar to the uterine lining grows outside the uterus, while PCOS is primarily an endocrine and metabolic disorder involving ovulatory dysfunction, hyperandrogenism, and frequently insulin resistance.",
        ],
      },
      {
        heading: "Why the symptoms overlap",
        paragraphs: [
          "The overlap matters because many people do not experience these diseases in a neat textbook form. A person with endometriosis may mainly notice bowel pain, fatigue, and heavy bleeding rather than dramatic period pain, while a person with PCOS may present first with irregular cycles, acne, weight changes, unwanted hair growth, or infertility.",
        ],
        bullets: [
          "Pelvic pain or pelvic discomfort",
          "Cycle irregularity or abnormal bleeding patterns",
          "Fertility challenges, though through different mechanisms",
          "Fatigue, bloating, and reduced quality of life",
        ],
      },
      {
        heading: "Endometriosis: an inflammatory condition",
        paragraphs: [
          "Endometriosis involves tissue similar to the endometrium growing outside the uterus, including on the ovaries, pelvic lining, bowel, or other nearby structures. These lesions can respond to hormonal cycling, triggering inflammation, pain, scarring, and adhesions that may distort anatomy over time.",
          "Goldstein and Cohen's 2023 study showed that non-invasive self-reported symptom data can be highly informative for identifying endometriosis risk. Their symptom-based machine learning approach identified a set of 24 symptoms that performed best for prediction, reporting an AUC of 0.94 with sensitivity of 0.93 and specificity of 0.95 in their best-performing model.",
        ],
      },
      {
        heading: "PCOS: a hormonal and metabolic condition",
        paragraphs: [
          "PCOS follows a different path. It is not caused by ectopic tissue growth, but by a complex interaction of reproductive hormones, androgen excess, metabolic dysfunction, and often insulin resistance, which together can disrupt ovulation and lead to irregular cycles.",
          "In a large EHR-based machine learning study of 30,601 women aged 18–45, non-linear models outperformed linear models for PCOS prediction, and gradient-boosted tree models reached AUCs of 80–85 percent across four prediction settings. This is important for users because PCOS is highly heterogeneous — some people fit the expected pattern of weight gain and obvious metabolic symptoms, while others have so-called lean PCOS or milder symptoms.",
        ],
      },
      {
        heading: "Why distinguishing the two matters",
        paragraphs: [
          "A person can experience similar daily symptoms but need very different investigations and management depending on the underlying condition. Endometriosis may require attention to pain mapping, inflammatory burden, and gastrointestinal symptoms, while PCOS often calls for closer assessment of ovulation, androgen excess, insulin resistance, and long-term endocrine health.",
          "A useful diary should track more than whether a cycle happened. It should capture symptom frequency, severity, timing, pain location, bowel involvement, fatigue, mood burden, and bleeding pattern — the kinds of structured features that allow better pattern recognition than anecdotal memory alone.",
        ],
      },
    ],
    references: [
      { label: "Goldstein & Cohen (2023) — Scientific Reports", url: "https://doi.org/10.1038/s41598-023-32761-8" },
      { label: "Zad et al. (2024) — Frontiers in Endocrinology", url: "https://doi.org/10.3389/fendo.2024.1298628" },
      { label: "Elmannai et al. (2023) — MDPI Diagnostics", url: "https://doi.org/10.3390/diagnostics13081506" },
      { label: "Mbuguiro et al. (2021) — Frontiers in Reproductive Health", url: "https://doi.org/10.3389/frph.2021.699133" },
      { label: "Emanuel et al. (2025) — Physical and Engineering Sciences in Medicine", url: "https://doi.org/10.1007/s13246-025-01539-9" },
    ],
  },

  {
    id:            "beyond-the-period",
    title:         "Beyond the Period: Understanding Fatigue, Mood, and 'Endo Belly'",
    category:      "conditions",
    emoji:         "💙",
    readTime:      "4 min read",
    excerpt:
      "Endometriosis and PCOS are often framed as reproductive conditions, but the most disruptive symptoms for many people are fatigue, digestive upset, anxiety, and a constant sense that the body is working against them.",
    sections: [
      {
        paragraphs: [
          "Endometriosis and PCOS are often described as reproductive or menstrual conditions, but that description is too narrow to reflect how people actually experience them. For many users, the most disruptive symptoms are not limited to bleeding days at all; they include digestive upset, chronic fatigue, anxiety, low mood, sleep disruption, and a daily sense that the body is working against them.",
          "Symptoms such as fatigue, bloating, and mood changes can affect work, study, concentration, relationships, and eating habits — even when they are harder for others to see.",
        ],
      },
      {
        heading: "The digestive side: 'endo belly' and bowel symptoms",
        paragraphs: [
          "One of the most commonly discussed non-menstrual symptoms in endometriosis communities is severe bloating, often called 'endo belly.' It may be painful, fluctuate through the cycle, and be accompanied by bowel urgency, constipation, diarrhea, nausea, or abdominal pressure.",
          "This symptom pattern makes biological sense. Endometriosis can involve pelvic inflammation and, in some cases, lesions near or on the bowel. Even when the bowel is not directly involved, inflammation and pain sensitization can still contribute to digestive discomfort.",
          "Because bloating and bowel symptoms are sometimes dismissed as 'just IBS,' people can be sent down the wrong care pathway for years. A useful diary should therefore separate abdominal bloating, bowel pain, painful bowel movements, constipation, diarrhea, and nausea rather than treating them as one vague symptom.",
        ],
      },
      {
        heading: "Fatigue is not just being tired",
        paragraphs: [
          "Fatigue in chronic gynecologic conditions is often misunderstood because it is invisible. In practice, many people describe it as exhaustion that is disproportionate to activity and not reliably fixed by rest, sleep, or caffeine.",
          "Research on symptom-based prediction has treated fatigue as clinically meaningful rather than as background noise. In endometriosis, symptom clusters that include pain burden and broader quality-of-life symptoms can help improve predictive accuracy, which reinforces the idea that fatigue should be taken seriously in both research and app design.",
        ],
      },
      {
        heading: "Mood, anxiety, and the emotional load",
        paragraphs: [
          "Hormonal fluctuations, chronic pain, uncertainty, and repeated invalidation can all affect mental health. This does not mean these conditions are 'psychological' — it means that living with a chronic inflammatory or endocrine disorder often has emotional consequences that deserve attention alongside physical symptoms.",
          "Users commonly report mood swings, irritability, anxiety, low mood, frustration, and reduced confidence in their own body. These experiences are especially important because they are often the symptoms people feel guilty discussing, even though they can be among the most disruptive.",
          "When apps reduce women's health to period dates alone, they miss the lived reality of the disease. Tracking fatigue, digestive symptoms, mental burden, and functional impact can make symptom histories more useful to both the user and to future research models.",
        ],
      },
    ],
    references: [
      { label: "Goldstein & Cohen (2023) — Scientific Reports", url: "https://doi.org/10.1038/s41598-023-32761-8" },
      { label: "Fruchart et al. (2023) — Digital Health", url: "https://doi.org/10.1177/20552076231176114" },
    ],
  },

  // ── CATEGORY 2: Evidence-Based Natural Remedies ───────────────────────────
  {
    id:            "inositol",
    title:         "Inositol: The Supplement Showing Promise for Mental Health and PCOS",
    category:      "remedies",
    emoji:         "💊",
    readTime:      "4 min read",
    excerpt:
      "Myo-inositol sits at the intersection of metabolic health, cycle regulation, and symptom management. A 2025 forum analysis found striking associations between inositol use and user-reported improvements in depression, anxiety, and mood.",
    sections: [
      {
        paragraphs: [
          "Inositol, especially myo-inositol and D-chiro-inositol, is one of the supplements most often discussed in PCOS communities because it sits at the intersection of metabolic health, cycle regulation, and symptom management. Its appeal comes partly from the fact that it is framed not as a cosmetic fix, but as a supplement that may support underlying insulin-related dysfunction in at least some people with PCOS.",
          "People do not just care about lab values. They care about whether they feel more stable, less anxious, less overwhelmed, and more in control of their cycles and body.",
        ],
      },
      {
        heading: "What forum-based machine learning found",
        paragraphs: [
          "A 2025 analysis of treatment sentiment in PCOS forums found that inositol was associated with especially positive user-reported sentiment for mental health-related outcomes. Reported risk ratios for improvement were 4.25 for depression, 5.83 for anxiety, and 25.00 for mood issues — highlighting that users often connect inositol with perceived emotional as well as metabolic benefit.",
          "These findings are valuable because they capture lived experience at scale, but they should also be interpreted carefully. Forum sentiment is not the same thing as a randomized controlled trial, and people who post online may not represent all patients equally.",
        ],
      },
      {
        heading: "Why it may help in PCOS",
        paragraphs: [
          "PCOS is often linked to insulin resistance, and inositol is commonly discussed as an insulin-sensitizing supplement. If insulin signaling improves, that can potentially influence ovulation patterns, androgen levels, and cycle regularity, which may indirectly improve how a person feels physically and emotionally.",
          "This does not mean inositol works the same way for everyone. PCOS is heterogeneous, and response may differ depending on metabolic profile, phenotype, dose, formulation, and what other treatments or lifestyle changes a person is using.",
        ],
      },
      {
        heading: "What to take from this",
        paragraphs: [
          "The useful takeaway is not that inositol is a miracle supplement. It is that both clinical reasoning and patient sentiment suggest it deserves attention as one of the more promising non-pharmacological options in PCOS symptom management, especially where metabolic dysfunction and cycle irregularity are prominent concerns.",
          "There is encouraging evidence and strong user interest, but decisions about supplements still need to consider medical history, medication interactions, fertility goals, and professional guidance.",
        ],
      },
    ],
    references: [
      { label: "Emanuel et al. (2025) — Physical and Engineering Sciences in Medicine", url: "https://doi.org/10.1007/s13246-025-01539-9" },
      { label: "Zad et al. (2024) — Frontiers in Endocrinology", url: "https://doi.org/10.3389/fendo.2024.1298628" },
    ],
  },

  {
    id:            "herbal-teas",
    title:         "Spearmint and Ginger: Can Herbal Teas Really Help?",
    category:      "remedies",
    emoji:         "🍵",
    readTime:      "4 min read",
    excerpt:
      "Spearmint's anti-androgenic properties and ginger's anti-inflammatory effects give both teas more biological credibility than most viral remedies — but the nuance matters. Here's what the evidence says.",
    sections: [
      {
        paragraphs: [
          "Herbal teas are popular partly because they feel accessible, low-cost, and easy to try. For users living with PCOS or endometriosis, that accessibility matters — especially after months or years of feeling unheard or overwhelmed by complicated treatment decisions.",
          "Still, the important question is not whether a remedy is popular, but whether there is a plausible reason it might help and whether users report a meaningful benefit. Spearmint and ginger are good examples because they are linked to different symptom pathways.",
        ],
      },
      {
        heading: "Spearmint tea and PCOS",
        paragraphs: [
          "Spearmint tea has attracted attention in PCOS discussions because of its reported anti-androgenic effects. Earlier clinical studies have suggested that spearmint tea consumption may reduce free testosterone and influence reproductive hormone patterns, which is why it is often discussed in relation to hirsutism, acne, and cycle regularity.",
          "That does not make it a standalone treatment for PCOS, but it does give it a more credible biological rationale than many viral remedies. It is best framed as a supportive strategy that may help some users, not as a replacement for endocrine evaluation or treatment when symptoms are significant.",
        ],
      },
      {
        heading: "Ginger for pain and digestive support",
        paragraphs: [
          "Ginger is more commonly linked to anti-inflammatory and anti-nausea support. In an educational setting, it makes sense to position ginger as a symptom-relief option that some users may find helpful for cramps, abdominal discomfort, and digestive unease rather than as a disease-modifying treatment.",
          "This distinction matters because many people living with chronic pelvic conditions are trying to reduce pain burden, not necessarily cure the underlying condition with tea. A good article should validate that symptom relief still matters — especially when it improves function or makes difficult days more manageable.",
        ],
      },
      {
        heading: "How to think about herbal remedies responsibly",
        paragraphs: [
          "The most helpful health writing avoids two extremes: dismissing natural remedies entirely, and overselling them as proof-backed cures. Readers benefit most when content explains the likely mechanism, the strength of the evidence, the limits of self-reported community sentiment, and the fact that herb-drug interactions or individual side effects still matter.",
          "For EndoWherAI, this kind of content works best when paired with diary features that let users track whether a remedy actually changes pain, bloating, mood, bleeding, or cycle patterns over time — rather than relying on memory alone.",
        ],
      },
    ],
    references: [
      { label: "Emanuel et al. (2025) — Physical and Engineering Sciences in Medicine", url: "https://doi.org/10.1007/s13246-025-01539-9" },
      { label: "Grant (2010) — Phytotherapy Research (spearmint anti-androgen)", url: "https://doi.org/10.1002/ptr.2900" },
      { label: "Akdogan et al. (2007) — Phytotherapy Research (spearmint RCT)", url: "https://doi.org/10.1002/ptr.2074" },
      { label: "Fruchart et al. (2023) — Digital Health", url: "https://doi.org/10.1177/20552076231176114" },
    ],
  },

  {
    id:            "intermittent-fasting",
    title:         "Dietary Strategies: Intermittent Fasting and PCOS",
    category:      "remedies",
    emoji:         "🥗",
    readTime:      "4 min read",
    excerpt:
      "A 2021 trial of eight-hour time-restricted feeding in women with anovulatory PCOS reported improvements in BMI, fasting insulin, testosterone markers, and menstrual regularity. Here's what the evidence means in practice.",
    sections: [
      {
        paragraphs: [
          "Weight management in PCOS is often discussed too simplistically. Many patients are given generic advice about calories and exercise, even though PCOS is strongly tied to insulin resistance, hormonal dysfunction, and metabolic heterogeneity that can make 'standard' approaches feel frustrating or ineffective.",
          "That is why time-restricted feeding and other forms of intermittent fasting have attracted attention. They shift the focus from only what is eaten to when eating occurs, which may influence insulin dynamics, appetite regulation, and metabolic stress.",
        ],
      },
      {
        heading: "What the evidence suggests",
        paragraphs: [
          "In a 2021 study on eight-hour time-restricted feeding in women with anovulatory PCOS, significant improvements were reported across body weight, BMI, body fat measures, testosterone-related markers, fasting insulin, HOMA-IR, and inflammatory markers. The study also reported improved menstrual irregularity in 73.3% of participants, with 11 of 15 showing improvement.",
          "A 2025 forum-based treatment sentiment study also found very strong user-reported signals around intermittent fasting and weight loss, including a reported risk ratio of 33.50 for weight loss success. That number is striking, but it should be read as a signal from patient community data rather than as proof of causal effect in the same way a randomized clinical trial would provide.",
        ],
      },
      {
        heading: "Why fasting may help some PCOS phenotypes",
        paragraphs: [
          "The main proposed mechanism is improved insulin sensitivity. When insulin levels stay chronically high, androgen production and ovulatory dysfunction may worsen, so strategies that improve insulin regulation may help reduce part of the metabolic pressure associated with PCOS.",
          "But 'may help' is the right phrase. Not every person with PCOS responds the same way, and fasting approaches may be difficult or inappropriate for people with eating disorder histories, high stress load, certain medications, or specific reproductive goals.",
        ],
      },
      {
        heading: "How to use this information",
        paragraphs: [
          "Intermittent fasting is promising for some women with PCOS, especially in insulin-related phenotypes, but success depends on adherence, safety, individual context, and whether the eating pattern is sustainable.",
          "This is also an area where an app can add real value. Longitudinal tracking can help users see whether a dietary strategy is actually changing weight trend, energy, cycle regularity, hunger, sleep, and symptom burden over time — rather than relying on short-term enthusiasm.",
        ],
      },
    ],
    references: [
      { label: "Li et al. (2021) — Journal of Translational Medicine (TRF in PCOS)", url: "https://doi.org/10.1186/s12967-021-02817-2" },
      { label: "Emanuel et al. (2025) — Physical and Engineering Sciences in Medicine", url: "https://doi.org/10.1007/s13246-025-01539-9" },
      { label: "Zad et al. (2024) — Frontiers in Endocrinology", url: "https://doi.org/10.3389/fendo.2024.1298628" },
    ],
  },

  {
    id:            "magnesium-vitamin-d",
    title:         "The Role of Magnesium and Vitamin D in Symptom Management",
    category:      "remedies",
    emoji:         "✨",
    readTime:      "3 min read",
    excerpt:
      "Vitamin D deficiency has been reported frequently in women with reproductive and metabolic disorders. Magnesium is closely associated with sleep quality, muscle relaxation, and cramp burden. Here's what users are saying and what the evidence supports.",
    sections: [
      {
        paragraphs: [
          "Supplements are often appealing in chronic conditions because they seem more manageable than prescription treatment pathways. Magnesium and vitamin D come up repeatedly in patient discussions because they are associated with sleep, mood, cramps, inflammation, and general resilience — even though they are not disease-specific cures.",
          "Vitamin D is especially relevant because deficiency has been reported frequently in women with reproductive and metabolic disorders, and because immune and inflammatory regulation may matter in both PCOS and endometriosis. Magnesium is often discussed in relation to muscle relaxation, sleep quality, nervous system support, and cramp burden.",
        ],
      },
      {
        heading: "Why this combination interests patients",
        paragraphs: [
          "The attraction is partly about symptom clusters. Many users are not trying to solve one isolated problem; they are trying to reduce a whole pattern of fatigue, poor sleep, anxiety, cramps, and general body stress. That makes combinations like magnesium plus vitamin D feel practical and holistic from the user perspective.",
          "Forum-based sentiment can be helpful for identifying which combinations people actually discuss positively, but it should not be mistaken for definitive clinical proof. A responsible interpretation is that these supplements may support symptom management, especially where deficiency or poor sleep is present, but they are still best considered part of a broader plan.",
        ],
      },
      {
        heading: "How to think about this",
        paragraphs: [
          "Magnesium and vitamin D may be sensible topics to explore with a clinician, especially if symptoms suggest deficiency, sleep disturbance, muscle tension, or inflammatory burden — but readers should not expect them to 'balance hormones' in a guaranteed or universal way.",
          "The app adds real value here by encouraging users to track concrete outcomes such as sleep quality, cramp severity, mood, and fatigue changes after starting a supplement, because that turns vague supplement experimentation into observable self-management data.",
        ],
      },
    ],
    references: [
      { label: "Emanuel et al. (2025) — Physical and Engineering Sciences in Medicine", url: "https://doi.org/10.1007/s13246-025-01539-9" },
    ],
  },

  // ── CATEGORY 3: Technology, Privacy & AI ─────────────────────────────────
  {
    id:            "xai",
    title:         "What Is Explainable AI (XAI)? Understanding Your Insights",
    category:      "technology",
    emoji:         "🤖",
    readTime:      "4 min read",
    excerpt:
      "AI predictions alone are not enough. EndoWherAI uses SHAP and LIME to show you exactly which symptom patterns influenced your result — so insights feel like information, not a black-box verdict.",
    sections: [
      {
        paragraphs: [
          "Many people are understandably skeptical of AI in healthcare because predictions alone are not enough. If a model says there may be a risk pattern, users and clinicians want to know what information influenced that result and whether the explanation is medically interpretable.",
          "That is the problem Explainable AI, or XAI, tries to address. Instead of treating the model as a sealed black box, XAI methods provide a way to inspect which inputs mattered most — either across the whole dataset or for one person's specific result.",
        ],
      },
      {
        heading: "SHAP and LIME in plain language",
        paragraphs: [
          "SHAP is often used for global and local feature importance because it helps estimate how much each variable contributed to a prediction, drawing on ideas from cooperative game theory. In practice, that means it can show whether features such as heavy bleeding, bowel pain, BMI, or a hormone measure are generally pushing predictions upward or downward.",
          "LIME works differently. It approximates the behavior of a complex model around one individual prediction, which makes it useful for answering a user-level question such as: 'Why did the system highlight this pattern for me specifically?'",
        ],
      },
      {
        heading: "Why this matters in women's health",
        paragraphs: [
          "In women's health, mistrust often grows when people feel they are once again being told something about their body without a clear explanation. XAI does not solve every problem, but it can make digital tools more transparent by connecting outputs back to understandable symptom features instead of unexplained scores.",
          "That matters especially if a platform is intended to support education and research rather than diagnosis. Explanations can help users understand trends, prepare for clinical conversations, and see that the system is recognizing patterns in fatigue, bleeding, pain, or metabolic markers rather than making arbitrary claims.",
        ],
      },
      {
        heading: "The limitation every user should know",
        paragraphs: [
          "An explanation is not the same thing as certainty. SHAP and LIME can make a model more interpretable, but they do not guarantee that the model is clinically correct, unbiased, or ready to replace professional judgment. This is exactly why XAI should be presented as a transparency layer — not as proof that an output is medically definitive.",
        ],
      },
    ],
    references: [
      { label: "Salih et al. (2024) — arXiv: Perspective on Explainable AI Methods", url: "https://arxiv.org/abs/2305.02012" },
      { label: "Zad et al. (2024) — Frontiers in Endocrinology", url: "https://doi.org/10.3389/fendo.2024.1298628" },
      { label: "Akter & Mustafa (2024) — PLOS ONE (XAI interpretability)", url: "https://doi.org/10.1371/journal.pone.0300670" },
    ],
  },

  {
    id:            "privacy-by-design",
    title:         "Privacy by Design: What Is a 'Pseudonymisation Domain'?",
    category:      "technology",
    emoji:         "🔐",
    readTime:      "4 min read",
    excerpt:
      "Under GDPR Art. 25 and EDPB 01/2025 guidelines, pseudonymisation separates identity from analysis — allowing health data to be research-ready without exposing who you are. Here's what that actually means.",
    sections: [
      {
        paragraphs: [
          "Privacy is not just a legal checkbox in health technology. It is one of the main reasons users decide whether they trust a platform enough to record painful, intimate, and highly personal data over time.",
          "Under GDPR, pseudonymisation refers to processing personal data so that it can no longer be attributed to a specific person without additional information — provided that the additional information is kept separately and protected by technical and organizational measures. The EDPB's 2025 guidance emphasizes that pseudonymised data is still personal data, but that strong pseudonymisation can significantly reduce risks and support privacy by design.",
        ],
      },
      {
        heading: "What a pseudonymisation domain means in practice",
        paragraphs: [
          "In plain language, a pseudonymisation domain is a separation layer between identity and analysis. One part of the system holds identifying information, while the research or analytics layer works on a separate representation — reducing the chance that researchers, analysts, or downstream systems can directly connect symptom patterns to a named individual.",
          "This matters because users often want two things at once: they want their data to contribute to better research, and they do not want to feel exposed by doing so. A well-designed pseudonymisation architecture is one way to support both goals.",
        ],
      },
      {
        heading: "What this does and does not mean",
        paragraphs: [
          "Pseudonymisation is powerful, but it is not the same as anonymity. The EDPB guidance makes that distinction important — the data may still be linkable under controlled conditions if the additional information exists and is accessible to an authorized party.",
          "That is actually a useful thing to explain openly. Users tend to trust systems more when the platform avoids exaggerated claims and clearly states both the protection and the limit.",
        ],
      },
      {
        heading: "Why this supports research",
        paragraphs: [
          "Longitudinal women's health data is valuable because symptom patterns emerge over time, but sensitive data sharing only works if people believe the architecture is careful by design. A pseudonymisation domain helps make research-ready data more usable while reducing unnecessary exposure of identity in the analytical workflow.",
        ],
      },
    ],
    references: [
      { label: "EDPB Guidelines 01/2025 — Pseudonymisation (PDF)", url: "https://www.edpb.europa.eu/system/files/2025-01/edpb_guidelines_202501_pseudonymisation_en.pdf" },
      { label: "GDPR Article 25 — Data Protection by Design", url: "https://gdpr-info.eu/art-25-gdpr/" },
    ],
  },

  {
    id:            "24-symptoms",
    title:         "The 24 Core Symptoms: The Science Behind Our Diary",
    category:      "technology",
    emoji:         "📊",
    readTime:      "3 min read",
    excerpt:
      "Goldstein & Cohen's 2023 study identified 24 self-reported symptoms that achieved an AUC of 0.94 for endometriosis prediction — the scientific foundation for why EndoWherAI's diary asks what it does.",
    sections: [
      {
        paragraphs: [
          "Most symptom trackers are broad but shallow. They let users mark that a period happened, maybe add a mood tag, and move on. That may be enough for casual cycle awareness, but it is usually not enough for research-grade pattern detection in a complex disease such as endometriosis.",
          "Goldstein and Cohen's 2023 study is important because it moved beyond generic period tracking and identified a 24-symptom set that was most effective for endometriosis prediction from self-reported data. Their best-performing model reached an AUC of 0.94, with sensitivity of 0.93 and specificity of 0.95 — showing that a carefully chosen set of non-invasive symptom inputs can be highly informative.",
        ],
      },
      {
        heading: "Why symptom depth matters",
        paragraphs: [
          "The value comes from specificity. Symptoms such as heavy bleeding, painful bowel movements, fatigue, and pelvic pain patterns capture more clinically meaningful signal than a yes-or-no period log.",
          "For a platform like EndoWherAI, this is a strong design principle. The diary should not ask for more data just to feel advanced; it should ask for the kinds of data that research has shown to be clinically relevant.",
        ],
      },
      {
        heading: "Why this improves usefulness for you",
        paragraphs: [
          "When the tracked features are clinically grounded, users get more than a record. They get a clearer history that can help them reflect on patterns, prepare for appointments, and contribute to datasets that are more useful for future research.",
          "This also helps distinguish EndoWherAI from generic wellness apps. It signals that the diary was built around symptom relevance, not just convenience or visual simplicity.",
        ],
      },
    ],
    references: [
      { label: "Goldstein & Cohen (2023) — Scientific Reports", url: "https://doi.org/10.1038/s41598-023-32761-8" },
      { label: "Goldstein & Cohen (2024) — Author correction", url: "https://doi.org/10.1038/s41598-024-61280-3" },
    ],
  },

  {
    id:            "future-of-digital-health",
    title:         "The Future of Digital Health: How Your Data Supports Global Research",
    category:      "technology",
    emoji:         "🌍",
    readTime:      "4 min read",
    excerpt:
      "The biggest barrier in women's health is not lack of interest — it is lack of structured, longitudinal, high-quality data. Here's how privacy-protected symptom tracking contributes to closing that gap.",
    sections: [
      {
        paragraphs: [
          "One of the biggest barriers in women's health is not lack of interest, but lack of structured, longitudinal, high-quality data. Many people try remedies, experience shifting symptoms, change diets, use supplements, stop treatments, restart them, and live through years of trial and error — yet very little of that real-world pattern becomes usable research data.",
          "That is what makes digital health potentially powerful. If symptom diaries are structured well, collected over time, and protected with strong privacy practices, they can help researchers study not only what symptoms are present, but how symptom trajectories change across different phenotypes, behaviors, and care pathways.",
        ],
      },
      {
        heading: "Why single-snapshot apps are not enough",
        paragraphs: [
          "An app that only records whether a period happened this month misses too much. Chronic pelvic and endocrine conditions unfold as patterns across months and years, and many of the most important questions are longitudinal: what worsens pain, what improves energy, what dietary or supplement changes seem to help, and which symptom clusters predict later diagnosis or treatment response.",
          "This is also where machine learning becomes more meaningful. Models become more useful when trained on structured features and repeated observations rather than one-off self-descriptions or incomplete clinic snapshots.",
        ],
      },
      {
        heading: "Why your entries matter to the research pipeline",
        paragraphs: [
          "Users are not just entering data for themselves. In a privacy-protected research environment, they are helping build the kind of dataset that has historically been missing in women's health: symptom-rich, time-based, real-world data that captures lived experience rather than only isolated clinical encounters.",
          "That does not mean every entry changes science overnight. It means that carefully collected data, at scale and over time, can help close the gap between anecdotal online advice and better evidence about which patterns, interventions, and trajectories deserve deeper study.",
        ],
      },
      {
        heading: "An invitation, not a promise",
        paragraphs: [
          "This platform works best when it invites users into the bigger picture without making exaggerated promises. The key message is that your data can support global research because it is structured, longitudinal, and privacy-aware — not because the app is claiming instant breakthroughs.",
        ],
      },
    ],
    references: [
      { label: "Goldstein & Cohen (2023) — Scientific Reports", url: "https://doi.org/10.1038/s41598-023-32761-8" },
      { label: "Zad et al. (2024) — Frontiers in Endocrinology", url: "https://doi.org/10.3389/fendo.2024.1298628" },
      { label: "Emanuel et al. (2025) — Physical and Engineering Sciences in Medicine", url: "https://doi.org/10.1007/s13246-025-01539-9" },
      { label: "EDPB Guidelines 01/2025 — Pseudonymisation", url: "https://www.edpb.europa.eu/our-work-tools/documents/public-consultations/2025/guidelines-012025-pseudonymisation_en" },
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryChip({ category }: { category: Exclude<Category, "all"> }) {
  const meta = CAT_META[category];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.bg} ${meta.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function DisclaimerBanner() {
  return (
    <div className="flex gap-3 rounded-2xl bg-amber-50 ring-1 ring-amber-200 px-4 py-3">
      <span className="shrink-0 text-lg">⚠️</span>
      <p className="text-xs leading-relaxed text-amber-800">
        <strong>Educational purposes only.</strong> EndoWherAI does not provide medical diagnosis, treatment, or emergency care. This article is not a substitute for advice from a qualified healthcare professional.
      </p>
    </div>
  );
}

function PostCard({ post, onClick }: { post: Post; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left rounded-3xl bg-bg ring-1 ring-ink/10 shadow-sm px-5 py-5 hover:shadow-md hover:ring-primary/30 transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-3xl leading-none">{post.emoji}</span>
        <CategoryChip category={post.category} />
      </div>
      <h3 className="text-base font-bold text-inkStrong leading-snug mb-2 group-hover:text-primary transition-colors">
        {post.title}
      </h3>
      <p className="text-sm text-inkMuted leading-relaxed line-clamp-3 mb-4">
        {post.excerpt}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-inkMuted">{post.readTime}</span>
        <span className="text-xs font-semibold text-primary">Read article →</span>
      </div>
    </button>
  );
}

function ArticleView({ post, onBack }: { post: Post; onBack: () => void }) {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-inkMuted hover:text-inkStrong transition-colors"
      >
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden>
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to all articles
      </button>

      {/* Hero */}
      <div className="mb-8">
        <CategoryChip category={post.category} />
        <h1 className="mt-3 text-2xl font-bold text-inkStrong leading-tight">
          {post.title}
        </h1>
        <p className="mt-1 text-sm text-inkMuted">{post.readTime}</p>
      </div>

      {/* Disclaimer */}
      <div className="mb-8">
        <DisclaimerBanner />
      </div>

      {/* Content */}
      <div className="space-y-6">
        {post.sections.map((section, i) => (
          <div key={i}>
            {section.heading && (
              <h2 className="text-lg font-bold text-inkStrong mb-3">{section.heading}</h2>
            )}
            {section.paragraphs?.map((p, j) => (
              <p key={j} className="text-sm leading-relaxed text-inkMuted mb-3">{p}</p>
            ))}
            {section.bullets && (
              <ul className="space-y-1.5 mt-2 mb-3">
                {section.bullets.map((b, j) => (
                  <li key={j} className="flex gap-2 text-sm text-inkMuted">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* References */}
      <div className="mt-10 pt-6 border-t border-ink/10">
        <h3 className="text-sm font-bold text-inkStrong mb-3">Sources & References</h3>
        <div className="space-y-2">
          {post.references.map((ref, i) => (
            <a
              key={i}
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 group"
            >
              <span className="mt-0.5 shrink-0 text-xs font-bold text-primary">↗</span>
              <span className="text-xs text-inkMuted group-hover:text-primary underline underline-offset-2 decoration-ink/20 group-hover:decoration-primary transition-colors">
                {ref.label}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Footer disclaimer (repeat) */}
      <div className="mt-8">
        <DisclaimerBanner />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EducationPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [selectedPost,   setSelectedPost]   = useState<Post | null>(null);

  const filtered = activeCategory === "all"
    ? POSTS
    : POSTS.filter((p) => p.category === activeCategory);

  const categoryGroups: { key: Exclude<Category, "all">; label: string }[] = [
    { key: "conditions",  label: "The Conditions" },
    { key: "remedies",    label: "Natural Remedies" },
    { key: "technology",  label: "Technology & Privacy" },
  ];

  if (selectedPost) {
    return (
      <PageShell
        title=""
        subtitle=""
      >
        <ArticleView post={selectedPost} onBack={() => setSelectedPost(null)} />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Education"
      subtitle="Evidence-based articles on endometriosis, PCOS, natural remedies, and the technology behind EndoWherAI."
    >
      {/* ── Category filter ── */}
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory("all")}
          className={[
            "rounded-full px-4 py-2 text-sm font-medium transition-colors",
            activeCategory === "all"
              ? "bg-inkStrong text-bg"
              : "bg-bgMuted text-inkStrong ring-1 ring-ink/10 hover:bg-bgSoft",
          ].join(" ")}
        >
          All articles
          <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
            {POSTS.length}
          </span>
        </button>
        {categoryGroups.map(({ key, label }) => {
          const meta  = CAT_META[key];
          const count = POSTS.filter((p) => p.category === key).length;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveCategory(key)}
              className={[
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                activeCategory === key
                  ? `${meta.bg} ${meta.color}`
                  : "bg-bgMuted text-inkStrong ring-1 ring-ink/10 hover:bg-bgSoft",
              ].join(" ")}
            >
              {label}
              <span className="ml-1.5 text-xs opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Category heading ── */}
      {activeCategory !== "all" && (
        <div className="mb-5">
          <h2 className="text-lg font-bold text-inkStrong">{CAT_META[activeCategory].label}</h2>
        </div>
      )}

      {/* ── Card grid ── */}
      {activeCategory === "all" ? (
        <div className="space-y-10">
          {categoryGroups.map(({ key }) => {
            const posts = POSTS.filter((p) => p.category === key);
            const meta  = CAT_META[key];
            return (
              <section key={key}>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                  <h2 className={`text-sm font-bold uppercase tracking-wider ${meta.color}`}>
                    {meta.label}
                  </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} onClick={() => setSelectedPost(post)} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
            <PostCard key={post.id} post={post} onClick={() => setSelectedPost(post)} />
          ))}
        </div>
      )}

      {/* ── All references footer ── */}
      <div className="mt-16 pt-8 border-t border-ink/10">
        <h3 className="text-sm font-bold text-inkStrong mb-1">All scientific references</h3>
        <p className="text-xs text-inkMuted mb-5">
          Every article links to its primary sources. This is the full reference list for this education section.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { label: "Goldstein & Cohen (2023) — Self-report symptom-based endometriosis prediction", url: "https://doi.org/10.1038/s41598-023-32761-8" },
            { label: "Goldstein & Cohen (2024) — Author correction", url: "https://doi.org/10.1038/s41598-024-61280-3" },
            { label: "Elmannai et al. (2023) — PCOS Detection ML & XAI", url: "https://doi.org/10.3390/diagnostics13081506" },
            { label: "Zad et al. (2024) — Predicting PCOS from EHR with ML", url: "https://doi.org/10.3389/fendo.2024.1298628" },
            { label: "Danaei Mehr & Polat (2021) — PCOS diagnosis with ML", url: "https://doi.org/10.1007/s12553-021-00613-y" },
            { label: "Sadegh-Zadeh et al. (2025) — Advancing PCOS Diagnosis with AI", url: "https://doi.org/10.62762/FBSP.2025.529389" },
            { label: "Emanuel et al. (2025) — Treatment sentiment in PCOS forums", url: "https://doi.org/10.1007/s13246-025-01539-9" },
            { label: "Fruchart et al. (2023) — Early symptoms of endometriosis via social networks", url: "https://doi.org/10.1177/20552076231176114" },
            { label: "Mbuguiro et al. (2021) — Computational models for endometriosis", url: "https://doi.org/10.3389/frph.2021.699133" },
            { label: "Salih et al. (2024) — Perspective on SHAP and LIME", url: "https://arxiv.org/abs/2305.02012" },
            { label: "El Furqany et al. (2025) — Hybrid Ensemble with SMOTEENN", url: "https://www.bright-journal.org/Journal/index.php/JADS/article/download/829/543" },
            { label: "Akter & Mustafa (2024) — XAI for thyroid disease classification", url: "https://doi.org/10.1371/journal.pone.0300670" },
            { label: "Li et al. (2021) — Time-restricted feeding in anovulatory PCOS", url: "https://doi.org/10.1186/s12967-021-02817-2" },
            { label: "Grant (2010) — Spearmint herbal tea and PCOS", url: "https://doi.org/10.1002/ptr.2900" },
            { label: "Akdogan et al. (2007) — Spearmint RCT", url: "https://doi.org/10.1002/ptr.2074" },
            { label: "EDPB Guidelines 01/2025 — Pseudonymisation", url: "https://www.edpb.europa.eu/system/files/2025-01/edpb_guidelines_202501_pseudonymisation_en.pdf" },
            { label: "GDPR Article 25 — Data Protection by Design", url: "https://gdpr-info.eu/art-25-gdpr/" },
            { label: "ONS (2024) — Endometriosis characteristics in England", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/healthandsocialcare/healthinequalities/bulletins/characteristicsofwomenwithanendometriosisdiagnosisinengland/latest" },
          ].map((ref, i) => (
            <a
              key={i}
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 group rounded-xl px-3 py-2 hover:bg-bgMuted/50 transition-colors"
            >
              <span className="mt-0.5 shrink-0 text-xs font-bold text-primary">↗</span>
              <span className="text-xs text-inkMuted group-hover:text-primary transition-colors leading-relaxed">
                {ref.label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
