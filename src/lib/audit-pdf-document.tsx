import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { AuditResult } from "./gbp-audit";

const teal = "#0d9488";
const darkBg = "#0f172a";
const gray = "#94a3b8";
const green = "#22c55e";
const red = "#ef4444";
const yellow = "#eab308";

const s = StyleSheet.create({
  page: { padding: 40, backgroundColor: "#ffffff", fontFamily: "Helvetica", fontSize: 11 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "bold", color: darkBg, marginBottom: 4 },
  subtitle: { fontSize: 12, color: gray },
  scoreSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
  },
  scoreBig: { fontSize: 48, fontWeight: "bold", marginRight: 16 },
  scoreLabel: { fontSize: 14, color: gray },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: darkBg, marginBottom: 8, marginTop: 16 },
  row: { flexDirection: "row", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  cellLabel: { flex: 1, color: "#334155" },
  cellValue: { width: 60, textAlign: "right", fontWeight: "bold" },
  cellStatus: { width: 60, textAlign: "right" },
  issueItem: { marginBottom: 4, color: "#334155" },
  recItem: { marginBottom: 6, color: "#334155", paddingLeft: 8 },
  compRow: { flexDirection: "row", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  compCell: { flex: 1, color: "#334155" },
  compHeader: { flex: 1, fontWeight: "bold", color: darkBg },
  cta: {
    marginTop: 30,
    padding: 16,
    backgroundColor: teal,
    borderRadius: 8,
    textAlign: "center",
  },
  ctaText: { color: "#ffffff", fontSize: 14, fontWeight: "bold" },
  ctaSub: { color: "#ccfbf1", fontSize: 11, marginTop: 4 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", fontSize: 9, color: gray },
});

function scoreColor(score: number): string {
  if (score >= 70) return green;
  if (score >= 40) return yellow;
  return red;
}

const breakdownLabels: Record<string, string> = {
  reviews: "Review Count",
  rating: "Star Rating",
  photos: "Photo Count",
  hours: "Hours Listed",
  website: "Website Linked",
  description: "Business Description",
  posts: "Google Posts Activity",
  vsCompetitors: "vs Competitors (Reviews)",
};

const breakdownMax: Record<string, number> = {
  reviews: 20,
  rating: 15,
  photos: 15,
  hours: 10,
  website: 10,
  description: 10,
  posts: 10,
  vsCompetitors: 10,
};

export function AuditPdfDocument({ data }: { data: AuditResult }) {
  const { business, competitors, score, breakdown, issues, recommendations } = data;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.title}>Google Business Profile Audit</Text>
          <Text style={s.subtitle}>
            {business.name} — {business.category} in {business.city}
          </Text>
        </View>

        <View style={s.scoreSection}>
          <Text style={[s.scoreBig, { color: scoreColor(score) }]}>
            {score}
          </Text>
          <View>
            <Text style={{ fontSize: 14, fontWeight: "bold", color: darkBg }}>
              out of 100
            </Text>
            <Text style={s.scoreLabel}>Overall GBP Health Score</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Score Breakdown</Text>
        {Object.entries(breakdown).map(([key, val]) => (
          <View style={s.row} key={key}>
            <Text style={s.cellLabel}>{breakdownLabels[key] || key}</Text>
            <Text style={[s.cellValue, { color: val > 0 ? green : red }]}>
              {val}/{breakdownMax[key] || "?"}
            </Text>
          </View>
        ))}

        <Text style={s.sectionTitle}>Issues Found ({issues.length})</Text>
        {issues.map((issue, i) => (
          <Text style={s.issueItem} key={i}>
            • {issue}
          </Text>
        ))}

        <Text style={s.sectionTitle}>Recommendations</Text>
        {recommendations.map((rec, i) => (
          <Text style={s.recItem} key={i}>
            {i + 1}. {rec}
          </Text>
        ))}

        <Text style={s.sectionTitle}>Competitor Comparison</Text>
        <View style={s.compRow}>
          <Text style={s.compHeader}>Business</Text>
          <Text style={s.compHeader}>Reviews</Text>
          <Text style={s.compHeader}>Rating</Text>
          <Text style={s.compHeader}>Photos</Text>
        </View>
        <View style={[s.compRow, { backgroundColor: "#f1f5f9" }]}>
          <Text style={[s.compCell, { fontWeight: "bold" }]}>
            {business.name} (You)
          </Text>
          <Text style={s.compCell}>{business.reviewCount}</Text>
          <Text style={s.compCell}>{business.rating}</Text>
          <Text style={s.compCell}>{business.photoCount}</Text>
        </View>
        {competitors.map((c, i) => (
          <View style={s.compRow} key={i}>
            <Text style={s.compCell}>{c.name}</Text>
            <Text style={s.compCell}>{c.reviewCount}</Text>
            <Text style={s.compCell}>{c.rating}</Text>
            <Text style={s.compCell}>{c.photoCount}</Text>
          </View>
        ))}

        <View style={s.cta}>
          <Text style={s.ctaText}>
            Want us to fix all of this for you?
          </Text>
          <Text style={s.ctaSub}>
            Book a free strategy call at trybookedout.com
          </Text>
        </View>

        <Text style={s.footer}>
          Generated by Booked Out — trybookedout.com
        </Text>
      </Page>
    </Document>
  );
}
