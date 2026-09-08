import { useEffect } from "react";
import { useRoute } from "wouter";
import CuratorAdmin from "./CuratorAdmin";

const anchors: Record<string, string> = {
  "archive-control": "specimen-manager",
  "specimen-editor": "specimen-manager",
  "media-chamber": "specimen-manager",
  "hero-carousel": "specimen-manager",
  "submission-inbox": "submissions",
  "dream-records": "dream-records",
  "resident-registry": "residents",
  "archive-doors": "specimen-manager",
  "dispatches-editor": "dispatches",
  "field-notes-library": "dispatches",
  "manifesto-editor": "settings",
  "site-configuration": "settings",
  "archive-audit": "audit",
};

export default function CuratorSection() {
  const [, params] = useRoute("/curator-admin/:section");
  const anchor = anchors[params?.section || ""] || "specimen-manager";
  useEffect(() => {
    const timer = window.setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
    return () => window.clearTimeout(timer);
  }, [anchor]);
  return <CuratorAdmin />;
}
