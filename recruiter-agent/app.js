const samples = [
  "Please complete the Python assessment by November 24 at 5 PM Central.",
  "Can we move your interview to November 25 at 10 AM Eastern? Please confirm your availability.",
  "Thank you for applying. We received your application and will review it shortly."
];
const labels = ["assessment invitation", "interview scheduling", "application receipt", "other message"];
const actions = ["Review the assessment instructions and confirm the deadline.", "Check availability and confirm the proposed time.", "File the receipt for reference.", "Review the message manually."];
const el = id => document.getElementById(id);
el("msg").value = samples[0];
el("sample").onchange = () => { el("msg").value = samples[el("sample").selectedIndex]; el("out").textContent = "Ready to analyze."; };
let classifier;
async function analyze(useModel) {
  const message = el("msg").value.trim();
  if (!message) { el("out").textContent = "Enter a message first."; return; }
  const controls = ["quick","model","sample","msg"].map(el);
  controls.forEach(control => control.disabled = true);
  try {
    let category;
    if (useModel) {
      el("out").textContent = "Loading the model and classifying this message…";
      const {pipeline, env} = await import("https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2");
      env.allowLocalModels = false;
      env.backends.onnx.wasm.numThreads = 1;
      classifier ??= await pipeline("zero-shot-classification","Xenova/mobilebert-uncased-mnli");
      const result = await classifier(message, labels);
      category = result.scores[0] >= 0.45 ? result.labels[0] : labels[3];
    } else {
      category = /assessment|coding challenge/i.test(message) ? labels[0] : /interview|availability/i.test(message) ? labels[1] : /received your application|thank you for applying/i.test(message) ? labels[2] : labels[3];
    }
    const timing = message.split(/(?<=[.!?])\s+/).find(sentence => /\b(?:by|deadline|reschedule|move your interview|AM|PM)\b/i.test(sentence));
    el("out").textContent = [useModel ? "Local AI model" : "Keyword check", category, actions[labels.indexOf(category)], timing ? "Timing in the message: " + timing : "No explicit timing found."].join("\n");
  } catch { el("out").textContent = "The model could not run in this browser. Try the keyword check or retry the model download."; }
  finally { controls.forEach(control => control.disabled = false); }
}
el("quick").onclick = () => analyze(false);
el("model").onclick = () => analyze(true);
