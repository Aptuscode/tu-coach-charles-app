import jsPDF from "jspdf";

export interface RoutinePdfDay {
  day: string;
  title?: string | null;
  exercises: Array<{
    name: string;
    sets?: number | null;
    reps?: string | null;
    rest_seconds?: number | null;
    notes?: string | null;
    video_url?: string | null;
  }>;
}

export function exportRoutineToPdf(routineName: string, description: string | null, days: RoutinePdfDay[]) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 50;

  // Header bar
  doc.setFillColor(5, 68, 94);
  doc.rect(0, 0, pageW, 70, "F");
  doc.setTextColor(255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Tu Coach Charles Isaac", 40, 32);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Plan de entrenamiento", 40, 52);

  y = 100;
  doc.setTextColor(5, 68, 94);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(routineName, 40, y);
  y += 22;
  if (description) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(80);
    const lines = doc.splitTextToSize(description, pageW - 80);
    doc.text(lines, 40, y);
    y += lines.length * 14 + 6;
  }

  for (const d of days) {
    if (y > 760) { doc.addPage(); y = 50; }
    doc.setFillColor(0, 188, 212);
    doc.rect(40, y, pageW - 80, 24, "F");
    doc.setTextColor(255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`${d.day}${d.title ? " — " + d.title : ""}`, 50, y + 16);
    y += 36;

    doc.setTextColor(40);
    doc.setFontSize(10);
    if (!d.exercises.length) {
      doc.setFont("helvetica", "italic");
      doc.text("Día de descanso", 50, y);
      y += 18;
      continue;
    }
    for (const ex of d.exercises) {
      if (y > 780) { doc.addPage(); y = 50; }
      doc.setFont("helvetica", "bold");
      doc.text(`• ${ex.name}`, 50, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      const meta = [
        ex.sets ? `${ex.sets} series` : null,
        ex.reps ? `${ex.reps} reps` : null,
        ex.rest_seconds ? `desc ${ex.rest_seconds}s` : null,
      ].filter(Boolean).join("  •  ");
      if (meta) { doc.text(meta, 64, y); y += 12; }
      if (ex.notes) {
        const notes = doc.splitTextToSize(`Notas: ${ex.notes}`, pageW - 130);
        doc.text(notes, 64, y);
        y += notes.length * 12;
      }
      if (ex.video_url) {
        doc.setTextColor(0, 120, 160);
        doc.text(`▶ ${ex.video_url}`, 64, y);
        doc.setTextColor(40);
        y += 12;
      }
      y += 4;
    }
    y += 6;
  }

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("Generado por Tu Coach Charles Isaac", 40, doc.internal.pageSize.getHeight() - 20);
  doc.save(`${routineName.replace(/\s+/g, "-")}.pdf`);
}
