import { useRef } from 'react';

const LEN = 6;

export default function OtpInput({ value, onChange, disabled }) {
  const refs = useRef([]);

  const focus = (i) => {
    const el = refs.current[Math.max(0, Math.min(LEN - 1, i))];
    if (el) el.focus();
  };

  const handleChange = (i, e) => {
    const ch = e.target.value.replace(/\D/g, '').slice(-1);
    if (!ch) return;
    if (i > value.length) return focus(value.length);
    onChange((value.slice(0, i) + ch + value.slice(i + 1)).slice(0, LEN));
    focus(i + 1);
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (value[i]) {
        onChange(value.slice(0, i) + value.slice(i + 1));
      } else if (i > 0) {
        onChange(value.slice(0, i - 1) + value.slice(i));
        focus(i - 1);
      }
    } else if (e.key === 'ArrowLeft') {
      focus(i - 1);
    } else if (e.key === 'ArrowRight') {
      focus(i + 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LEN);
    if (digits) {
      onChange(digits);
      focus(digits.length);
    }
  };

  return (
    <div className="otp" onPaste={handlePaste}>
      {Array.from({ length: LEN }, (_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          className="otp__box"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          autoFocus={i === 0}
          disabled={disabled}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}
