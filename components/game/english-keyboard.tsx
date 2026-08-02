"use client";

import styles from "./english-keyboard.module.css";

const TOP_ROW = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"];
const HOME_ROW = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];
const BOTTOM_ROW = ["Z", "X", "C", "V", "B", "N", "M"];

export type EnglishKeyboardProps = {
  disabled?: boolean;
  onSubmit: () => void;
  onValueChange: (value: string) => void;
  value: string;
};

export function EnglishKeyboard({
  disabled = false,
  onSubmit,
  onValueChange,
  value,
}: EnglishKeyboardProps) {
  function appendCharacter(character: string) {
    onValueChange(`${value}${character}`);
  }

  function removeLastCharacter() {
    if (value.length > 0) {
      onValueChange(value.slice(0, -1));
    }
  }

  return (
    <div
      aria-label="English keyboard"
      className={styles.keyboard}
      role="group"
    >
      <div className={styles.row}>
        {TOP_ROW.map((letter) => (
          <LetterKey
            disabled={disabled}
            key={letter}
            label={letter}
            onPress={appendCharacter}
          />
        ))}
      </div>

      <div className={`${styles.row} ${styles.homeRow}`}>
        {HOME_ROW.map((letter) => (
          <LetterKey
            disabled={disabled}
            key={letter}
            label={letter}
            onPress={appendCharacter}
          />
        ))}
      </div>

      <div className={styles.row}>
        <DisabledKey className={styles.wideKey} label="123" />
        {BOTTOM_ROW.map((letter) => (
          <LetterKey
            disabled={disabled}
            key={letter}
            label={letter}
            onPress={appendCharacter}
          />
        ))}
        <button
          aria-label="Backspace"
          className={`${styles.key} ${styles.wideKey} ${styles.iconKey}`}
          disabled={disabled}
          onClick={removeLastCharacter}
          title="Backspace"
          type="button"
        >
          ⌫
        </button>
      </div>

      <div className={styles.row}>
        <DisabledKey className={styles.languageKey} label="한/영" />
        <button
          className={`${styles.key} ${styles.spaceKey}`}
          disabled={disabled}
          onClick={() => appendCharacter(" ")}
          type="button"
        >
          Space
        </button>
        <button
          className={`${styles.key} ${styles.enterKey}`}
          disabled={disabled}
          onClick={onSubmit}
          type="button"
        >
          Enter
        </button>
      </div>
    </div>
  );
}

function LetterKey({
  disabled,
  label,
  onPress,
}: {
  disabled: boolean;
  label: string;
  onPress: (value: string) => void;
}) {
  return (
    <button
      className={styles.key}
      disabled={disabled}
      onClick={() => onPress(label)}
      type="button"
    >
      {label}
    </button>
  );
}

function DisabledKey({ className, label }: { className: string; label: string }) {
  return (
    <button
      aria-label={`${label} keyboard unavailable`}
      className={`${styles.key} ${styles.disabledKey} ${className}`}
      disabled
      type="button"
    >
      {label}
    </button>
  );
}
