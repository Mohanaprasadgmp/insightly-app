"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { ReportPDFDocument } from "./ReportPDF";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  clientName: string;
  periodLabel: string;
  summary: string;
  agencyName: string;
  brandColor: string;
  fileName: string;
  disabled?: boolean;
}

export function PDFDownloadButton({
  title,
  clientName,
  periodLabel,
  summary,
  agencyName,
  brandColor,
  fileName,
  disabled,
}: Props) {
  return (
    <PDFDownloadLink
      document={
        <ReportPDFDocument
          title={title}
          clientName={clientName}
          periodLabel={periodLabel}
          summary={summary}
          agencyName={agencyName}
          brandColor={brandColor}
        />
      }
      fileName={fileName}
    >
      {({ loading }) => (
        <Button variant="outline" size="sm" disabled={loading || disabled}>
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Download PDF
        </Button>
      )}
    </PDFDownloadLink>
  );
}
