"use client";

export function PrintButton() {
  return (
    <button className="btn" onClick={() => window.print()} style={{ fontWeight: "bold" }}>
      🖨️ Print Bill
    </button>
  );
}
