"use client";

import { useEffect, useState, use } from "react";

export default function PreviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadSite() {
      try {
        const res = await fetch(`/api/preview/${token}`);
        if (!res.ok) {
          setError(true);
          return;
        }
        const text = await res.text();
        setHtml(text);
      } catch {
        setError(true);
      }
    }
    loadSite();
  }, [token]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Site Not Found</h1>
          <p className="mt-2 text-gray-500">
            This preview link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <p className="mt-3 text-sm text-gray-500">Loading preview...</p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={html}
      title="Website Preview"
      className="h-screen w-full border-0"
      sandbox="allow-same-origin allow-scripts"
    />
  );
}
