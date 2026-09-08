import { useEffect, useState } from "react";

type LightboxDetail = { src: string; alt: string; kind: "image" | "video" | "audio" };

export default function VeilhouseLightbox() {
  const [detail, setDetail] = useState<LightboxDetail | null>(null);
  useEffect(() => {
    const open = (event: Event) => setDetail((event as CustomEvent<LightboxDetail>).detail);
    window.addEventListener("veilhouse-lightbox", open);
    return () => window.removeEventListener("veilhouse-lightbox", open);
  }, []);
  useEffect(() => {
    if (!detail) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setDetail(null);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [detail]);
  if (!detail) return null;
  return <div className="veilhouse-lightbox" role="dialog" aria-modal="true" aria-label={`Archive ${detail.kind} preview`} onClick={() => setDetail(null)}><figure onClick={(event) => event.stopPropagation()}><button className="veilhouse-lightbox-close" type="button" onClick={() => setDetail(null)} aria-label="Close preview">×</button>{detail.kind === "image" ? <img src={detail.src} alt={detail.alt} /> : detail.kind === "video" ? <video src={detail.src} controls autoPlay playsInline /> : <audio src={detail.src} controls autoPlay /> }<figcaption>{detail.alt} <span>THE HOUSE IS LISTENING</span></figcaption></figure></div>;
}

export function openVeilhouseLightbox(event: React.MouseEvent, src: string, alt: string) {
  event.preventDefault();
  event.stopPropagation();
  window.dispatchEvent(new CustomEvent<LightboxDetail>("veilhouse-lightbox", { detail: { src, alt, kind: "image" } }));
}

export function openVeilhouseMediaLightbox(event: React.MouseEvent, src: string, alt: string, kind: "video" | "audio") {
  event.preventDefault();
  event.stopPropagation();
  window.dispatchEvent(new CustomEvent<LightboxDetail>("veilhouse-lightbox", { detail: { src, alt, kind } }));
}
