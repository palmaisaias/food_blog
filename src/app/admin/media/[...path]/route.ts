import { servePhoto } from "@/lib/media";

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return servePhoto(request, (await params).path, true);
}
