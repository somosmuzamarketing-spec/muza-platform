"use client";
import { useState } from "react";

export default function ReferralBox({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="referral-box">
      <input readOnly value={link} onFocus={(e) => e.target.select()} />
      <button type="button" className="secondary" onClick={copy} style={{ whiteSpace: "nowrap" }}>
        {copied ? "¡Copiado! ✓" : "Copiar enlace"}
      </button>
    </div>
  );
}
