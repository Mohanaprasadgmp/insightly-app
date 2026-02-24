import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

interface ReportPDFProps {
  title: string;
  clientName: string;
  periodLabel: string;
  summary: string;
  agencyName: string;
  brandColor: string;
}

/** Strip markdown syntax for plain-text PDF rendering */
function stripMarkdown(line: string): string {
  return line
    .replace(/^#{1,3}\s+/, "")  // remove # ## ###
    .replace(/\*\*(.+?)\*\*/g, "$1")  // remove **bold**
    .replace(/^[-•]\s+/, "• ");  // normalise bullets
}

function parseSummaryLines(summary: string) {
  return summary.split("\n").map((raw, i) => {
    const line = raw.trim();
    if (!line) return { key: i, type: "gap" as const, text: "" };
    if (/^#{1,3}\s/.test(line)) return { key: i, type: "heading" as const, text: stripMarkdown(line) };
    if (/^[-•]/.test(line)) return { key: i, type: "bullet" as const, text: stripMarkdown(line) };
    return { key: i, type: "body" as const, text: stripMarkdown(line) };
  });
}

export function ReportPDFDocument({
  title,
  clientName,
  periodLabel,
  summary,
  agencyName,
  brandColor,
}: ReportPDFProps) {
  const lines = parseSummaryLines(summary);
  const color = brandColor ?? "#6366f1";

  const styles = StyleSheet.create({
    page: { fontFamily: "Helvetica", backgroundColor: "#ffffff", paddingBottom: 48 },
    header: { backgroundColor: color, padding: "24 32", marginBottom: 0 },
    headerAgency: { color: "#ffffff", fontSize: 16, fontFamily: "Helvetica-Bold" },
    headerSub: { color: "rgba(255,255,255,0.8)", fontSize: 10, marginTop: 4 },
    meta: { padding: "20 32 16", borderBottom: "1 solid #e5e7eb" },
    reportTitle: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#111827", marginBottom: 6 },
    metaRow: { flexDirection: "row", gap: 16, marginTop: 2 },
    metaLabel: { fontSize: 10, color: "#6b7280" },
    metaValue: { fontSize: 10, color: "#374151", fontFamily: "Helvetica-Bold" },
    body: { padding: "16 32" },
    heading: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#111827", marginTop: 16, marginBottom: 4 },
    bullet: { fontSize: 10, color: "#374151", marginLeft: 12, marginBottom: 3, lineHeight: 1.5 },
    bodyText: { fontSize: 10, color: "#374151", marginBottom: 4, lineHeight: 1.6 },
    gap: { height: 6 },
    footer: { position: "absolute", bottom: 20, left: 32, right: 32, borderTop: "1 solid #e5e7eb", paddingTop: 8 },
    footerText: { fontSize: 9, color: "#9ca3af", textAlign: "center" },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerAgency}>{agencyName}</Text>
          <Text style={styles.headerSub}>Client Performance Report</Text>
        </View>

        {/* Meta */}
        <View style={styles.meta}>
          <Text style={styles.reportTitle}>{title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Client: </Text>
            <Text style={styles.metaValue}>{clientName}</Text>
            <Text style={styles.metaLabel}>  Period: </Text>
            <Text style={styles.metaValue}>{periodLabel}</Text>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {lines.map((l) => {
            if (l.type === "gap") return <View key={l.key} style={styles.gap} />;
            if (l.type === "heading") return <Text key={l.key} style={styles.heading}>{l.text}</Text>;
            if (l.type === "bullet") return <Text key={l.key} style={styles.bullet}>{l.text}</Text>;
            return <Text key={l.key} style={styles.bodyText}>{l.text}</Text>;
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Prepared by {agencyName} · Delivered via Reportiq
          </Text>
        </View>
      </Page>
    </Document>
  );
}
