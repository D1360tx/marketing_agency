export default async function PreviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <iframe
      src={`/api/preview/${token}`}
      title="Website Preview"
      className="h-screen w-full border-0"
      sandbox="allow-scripts"
    />
  );
}
