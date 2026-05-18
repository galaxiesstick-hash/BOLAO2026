"use client";

interface ScoreInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  max?: number;
}

export default function ScoreInput({
  value,
  onChange,
  disabled = false,
  max = 20,
}: ScoreInputProps) {
  const decrement = () => {
    if (value > 0) onChange(value - 1);
  };

  const increment = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={decrement}
        disabled={disabled || value <= 0}
        className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white font-bold text-lg transition-all active:scale-95"
        aria-label="Diminuir"
      >
        −
      </button>
      <span className="text-3xl font-bold text-white w-8 text-center tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={increment}
        disabled={disabled || value >= max}
        className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white font-bold text-lg transition-all active:scale-95"
        aria-label="Aumentar"
      >
        +
      </button>
    </div>
  );
}
