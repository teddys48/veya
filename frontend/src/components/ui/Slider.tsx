import React from 'react';

export interface SliderProps {
  value: number;
  min?: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
  ariaLabel?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min = 0,
  max,
  step = 1,
  onChange,
  className = '',
  ariaLabel = 'Slider',
}) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className={`relative flex items-center w-full select-none ${className}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-3 bg-[var(--muted-bg)] border-2 border-black accent-[var(--primary)] cursor-pointer appearance-none rounded-none shadow-[2px_2px_0px_0px_#000]"
        style={{
          background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${percentage}%, var(--muted-bg) ${percentage}%, var(--muted-bg) 100%)`,
        }}
      />
    </div>
  );
};
