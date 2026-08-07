import React, { useRef, useState } from "react";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";
import withBase from "../utils/apiBase";

type ImportResult = {
  ok?: boolean;
  sourceRows?: number;
  categories?: number;
  services?: number;
  staffVariants?: number;
  createdServices?: number;
  updatedServices?: number;
  error?: string;
};

const getToken = () =>
  localStorage.getItem("kleo_token") || localStorage.getItem("token") || "";

export default function AltegioServiceImportButton() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const importFile = async (file: File) => {
    const token = getToken();
    if (!token) {
      setIsError(true);
      setMessage("Az importhoz be kell jelentkezni.");
      return;
    }

    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".xlsx") && !lower.endsWith(".xls")) {
      setIsError(true);
      setMessage("Altegio Excel fájlt válassz (.xlsx vagy .xls).");
      return;
    }

    const form = new FormData();
    form.append("file", file);

    try {
      setUploading(true);
      setIsError(false);
      setMessage("Altegio szolgáltatások importálása…");

      const res = await fetch(withBase("services/import/altegio"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const data = (await res.json().catch(() => ({}))) as ImportResult;
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `Import hiba (${res.status})`);
      }

      setMessage(
        `${data.categories ?? 0} kategória, ${data.services ?? 0} szolgáltatás, ` +
        `${data.staffVariants ?? 0} szakember-időtartam kapcsolat importálva. ` +
        `Új: ${data.createdServices ?? 0}, frissített: ${data.updatedServices ?? 0}.`
      );
      setTimeout(() => window.location.reload(), 1800);
    } catch (e: any) {
      setIsError(true);
      setMessage(e?.message || "Az Altegio import nem sikerült.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 10,
      padding: "10px 18px 0",
      flexWrap: "wrap",
    }}>
      {message && (
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          color: isError ? "#b42318" : "#357a55",
          maxWidth: 720,
        }}>
          {message}
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void importFile(file);
        }}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        title="Altegio szolgáltatás-export importálása"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          border: "1px solid rgba(181,151,90,.35)",
          borderRadius: 10,
          background: "#fff",
          padding: "9px 13px",
          cursor: uploading ? "wait" : "pointer",
          fontWeight: 700,
          fontSize: 13,
        }}
      >
        {uploading ? <Loader2 size={16} /> : <FileSpreadsheet size={16} />}
        {uploading ? "Importálás…" : "Altegio Excel import"}
        {!uploading && <Upload size={14} />}
      </button>
    </div>
  );
}
