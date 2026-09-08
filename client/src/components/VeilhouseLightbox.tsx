import { useEffect, useState } from "react";
import { X } from "lucide-react";

type LightboxDetail = { src: string; alt: string };

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
  return <div className="veilhouse-lightbox" role="dialog" aria-modal="true" aria-label="Enlarged archive image" onClick={() => setDetail(null)}><figure onClick={(event) => event.stopPropagation()}><button type="button" onClick={() => setDetail(null)} aria-label="Close image chamber"><X size={18} /></button><img src={detail.src} alt={detail.alt} /><figcaption>{detail.alt} <span>ESC TO CLOSE</span></figcaption></figure></div>;
}

export function openVeilhouseLightbox(event: React.MouseEvent, src: string, alt: string) {
  event.preventDefault();
  event.stopPropagation();
  window.dispatchEvent(new CustomEvent<LightboxDetail>("veilhouse-lightbox", { detail: { src, alt } }));
}
