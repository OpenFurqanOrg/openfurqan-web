"use client";

import { usePreferences } from "../../contexts";

export default function ReaderTextScaleControls() {
  const { fontScale, setFontScale } = usePreferences();
  return (
    <div className="sliders-row">
            <div className="quick-slider">
              <span>Arabic</span>
              <input
                type="range"
                min="0.8"
                max="1.4"
                step="0.05"
                value={fontScale.arabic}
                onChange={(e) =>
                  setFontScale((prev) => ({
                    ...prev,
                    arabic: Number(e.target.value)
                  }))
                }
              />
            </div>
            <div className="quick-slider">
              <span>Translation</span>
              <input
                type="range"
                min="0.9"
                max="1.4"
                step="0.05"
                value={fontScale.translation}
                onChange={(e) =>
                  setFontScale((prev) => ({
                    ...prev,
                    translation: Number(e.target.value)
                  }))
                }
              />
            </div>
          </div>
  );
}
