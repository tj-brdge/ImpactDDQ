const STEPS = [
  { key: "upload", label: "Upload" },
  { key: "anonymize", label: "Anonymize" },
  { key: "inspect", label: "Inspect" },
  { key: "extract", label: "Extract" },
  { key: "review", label: "Review" },
  { key: "tag", label: "Tag" },
  { key: "done", label: "Done" },
];

export default function Stepper({ currentStep }) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center justify-between mb-8 px-4">
      {STEPS.map((step, i) => {
        const isActive = i === currentIndex;
        const isComplete = i < currentIndex;
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all ${
                  isComplete
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : isActive
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-white border-slate-300 text-slate-400"
                }`}
              >
                {isComplete ? "\u2713" : i + 1}
              </div>
              <span
                className={`text-xs mt-1.5 font-medium ${
                  isActive ? "text-indigo-600" : isComplete ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mt-[-12px] ${
                  i < currentIndex ? "bg-emerald-400" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
