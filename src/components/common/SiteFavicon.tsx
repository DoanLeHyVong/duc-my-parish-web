import { useEffect } from 'react';

const parishFavicon = '/favicon.svg?v=parish-1';
const touchFavicon = '/favicon-touch.png?v=parish-1';

function faviconHref(url?: string, revision?: string) {
  if (!url?.trim()) return parishFavicon;
  try {
    const parsed = new URL(url, window.location.origin);
    if (!['https:', 'http:'].includes(parsed.protocol)) return parishFavicon;
    if (revision) parsed.searchParams.set('parishIconRevision', revision);
    return parsed.href;
  } catch {
    return parishFavicon;
  }
}

// Own the initial HTML link too: leaving it alongside Helmet's link lets the
// browser choose a stale icon. Do not declare a fixed SVG MIME type for PNGs.
export function SiteFavicon({ url, revision }: { url?: string; revision?: string }) {
  const href = faviconHref(url, revision);
  useEffect(() => {
    let active = true;
    const links = ['icon', 'apple-touch-icon'].map((rel) => {
      const existing = [...document.head.querySelectorAll<HTMLLinkElement>(`link[rel~="${rel}" i]`)];
      const link = existing.shift() || document.createElement('link');
      existing.forEach((duplicate) => duplicate.remove());
      link.rel = rel;
      link.removeAttribute('type');
      link.removeAttribute('sizes');
      link.removeAttribute('media');
      const fallbackHref = rel === 'apple-touch-icon' ? touchFavicon : parishFavicon;
      link.href = href === parishFavicon ? fallbackHref : href;
      const fallback = () => { link.href = fallbackHref; };
      link.addEventListener('error', fallback, { once: true });
      if (!link.isConnected) document.head.appendChild(link);
      return { link, fallback };
    });
    // Chromium does not reliably dispatch error on favicon links. An image
    // probe also detects a 404 or an HTML response returned for an unknown URL.
    const probe = href === parishFavicon ? null : new Image();
    if (probe) {
      probe.onerror = () => { if (active) links.forEach(({ fallback }) => fallback()); };
      probe.src = href;
    }
    return () => {
      active = false;
      if (probe) probe.onerror = null;
      links.forEach(({ link, fallback }) => link.removeEventListener('error', fallback));
    };
  }, [href]);
  return null;
}
