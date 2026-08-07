import { IntakeForm, OutputKind } from "./types";

// Placeholder generators. Swap the bodies for real AI API calls once a key
// is wired up — the shape (kind, form) -> string stays the same.

function fallback(value: string, label: string) {
  return value.trim().length > 0 ? value.trim() : label;
}

function generatePlan(form: IntakeForm): string {
  const business = fallback(form.businessName, "your business");
  const industry = fallback(form.industry, "your industry");
  const problem = fallback(form.problem, "getting consistent customers");
  const goal = fallback(form.goals, "steady, trackable growth");

  return [
    `POSITIONING ANGLE`,
    `${business} shouldn't compete on "we do ${industry} too." Lead with the specific problem you already solve — ${problem} — and let that be the hook in every post, not a footnote.`,
    ``,
    `CONTENT DIRECTION (first 2 weeks)`,
    `1. One reel that dramatizes the problem itself ("${problem}") before ever mentioning ${business} — curiosity first, brand second.`,
    `2. One customer-style story post: a believable before/after tied to "${goal}".`,
    `3. One myth-bust or misconception post specific to ${industry} — builds authority fast.`,
    `4. One behind-the-scenes / founder-voice post — trust compounds faster than polish.`,
    ``,
    `NEXT STEP`,
    `Lock the angle above, then build a 4-week content calendar against it and pair it with a small paid test to see which hook actually converts.`,
  ].join("\n");
}

function generateNumbers(form: IntakeForm): string {
  const budgetNum = parseFloat(form.monthlyBudget.replace(/[^0-9.]/g, "")) || 300;
  const location = fallback(form.location, "your local area");

  const cpmLow = 8;
  const cpmHigh = 12;
  const impressionsLow = Math.round((budgetNum / cpmHigh) * 1000);
  const impressionsHigh = Math.round((budgetNum / cpmLow) * 1000);
  const reachLow = Math.round(impressionsLow * 0.5);
  const reachHigh = Math.round(impressionsHigh * 0.65);
  const clicksLow = Math.round(reachLow * 0.02);
  const clicksHigh = Math.round(reachHigh * 0.02);
  const salesLow = Math.round(clicksLow * 0.04);
  const salesHigh = Math.round(clicksHigh * 0.05);
  const costPerSale = salesHigh > 0 ? Math.round(budgetNum / salesHigh) : 0;

  return [
    `PROJECTION — €${budgetNum} / month, local radius around ${location}`,
    `(Industry-average model — replace with your real numbers after month one.)`,
    ``,
    `Impressions:        ${impressionsLow.toLocaleString()} – ${impressionsHigh.toLocaleString()}`,
    `Unique reach:        ${reachLow.toLocaleString()} – ${reachHigh.toLocaleString()}`,
    `Clicks (~2% CTR):    ${clicksLow.toLocaleString()} – ${clicksHigh.toLocaleString()}`,
    `Est. sales (4–5%):   ${salesLow} – ${salesHigh}`,
    `Approx. cost/sale:   €${costPerSale || "—"}`,
    ``,
    `This is the same model we'd run for real ad spend — once live, we replace these ranges with your actual account data.`,
  ].join("\n");
}

function generateCreative(form: IntakeForm): string {
  const business = fallback(form.businessName, "your business");
  const problem = fallback(form.problem, "a problem your customers deal with");

  return [
    `REEL HOOK (first 2 seconds, on-screen text)`,
    `"Nobody tells you this about ${problem}..."`,
    ``,
    `SCRIPT BEAT (15–20s)`,
    `0-2s  Hook line above, fast cut, no logo yet.`,
    `2-8s  Show the problem playing out — relatable, slightly exaggerated, a little funny.`,
    `8-14s The turn: how ${business} makes this a non-issue — show, don't explain.`,
    `14-18s Quick payoff / punchline to make it shareable.`,
    `18-20s Soft CTA on screen: "Try it — link in bio."`,
    ``,
    `CAPTION`,
    `"We built ${business} because ${problem} shouldn't be this hard. Tag someone who needs to see this 👇"`,
  ].join("\n");
}

export function generateOutput(kind: OutputKind, form: IntakeForm): string {
  switch (kind) {
    case "plan":
      return generatePlan(form);
    case "numbers":
      return generateNumbers(form);
    case "creative":
      return generateCreative(form);
  }
}
