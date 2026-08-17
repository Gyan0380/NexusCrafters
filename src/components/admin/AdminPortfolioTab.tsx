import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addPortfolioVideoLink,
  deletePortfolioMedia,
  updatePortfolioMedia,
  uploadPortfolioMedia,
  type PortfolioMedia,
} from "@/lib/cms";
import { usePortfolioMedia } from "@/lib/use-site-data";

function youtubeEmbedUrl(url: string): string | null {
  const patterns = [/youtu\.be\/([\w-]+)/, /youtube\.com\/watch\?v=([\w-]+)/, /youtube\.com\/embed\/([\w-]+)/];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }
  return null;
}

export function AdminPortfolioTab() {
  const { data: media = [], isLoading } = usePortfolioMedia(true);
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("websites");
  const [progress, setProgress] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["portfolio_media"] });

  async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    let done = 0;
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name}: only photos can be uploaded here — paste a video link below instead`);
        continue;
      }
      setProgress(`Uploading ${done + 1} of ${files.length}…`);
      try {
        await uploadPortfolioMedia(file, {
          ...(files.length === 1 && title.trim() ? { title: title.trim() } : {}),
          category,
        });
        done += 1;
      } catch {
        toast.error(`Upload failed: ${file.name}`);
      }
    }
    setProgress(null);
    setTitle("");
    if (inputRef.current) inputRef.current.value = "";
    if (done) toast.success(`${done} file${done > 1 ? "s" : ""} uploaded`);
    refresh();
  }

  const addVideo = useMutation({
    mutationFn: () =>
      addPortfolioVideoLink(videoUrl, {
        title: videoTitle.trim() || undefined,
        category,
      }),
    onSuccess: () => {
      toast.success("Video added");
      setVideoUrl("");
      setVideoTitle("");
      refresh();
    },
    onError: () => toast.error("Could not add this video link"),
  });

  const remove = useMutation({
    mutationFn: (item: PortfolioMedia) => deletePortfolioMedia(item),
    onSuccess: () => {
      toast.success("Media deleted");
      refresh();
    },
    onError: () => toast.error("Could not delete this item"),
  });

  const toggle = useMutation({
    mutationFn: (item: PortfolioMedia) =>
      updatePortfolioMedia(item.id, { published: !(item.published !== false) }),
    onSuccess: refresh,
  });

  return (
    <div className="space-y-8">
      <div className="glass-panel space-y-4 rounded-3xl p-6">
        <h2 className="font-display text-xl font-bold">Upload photos</h2>
        <p className="text-sm text-muted-foreground">
          Photos are compressed in your browser and saved as base64 directly in Firestore — no
          Firebase Storage needed. Videos are too big to store this way; add them as a link below
          (YouTube, Google Drive share link, or a direct .mp4 URL).
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="media-title">Title (single upload)</Label>
            <Input
              id="media-title"
              className="mt-2"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Optional — defaults to the file name"
            />
          </div>
          <div>
            <Label htmlFor="media-category">Category</Label>
            <select
              id="media-category"
              className="mt-2 h-9 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="websites">Websites</option>
              <option value="discord_bots">Discord Bots</option>
              <option value="discord_servers">Discord Servers</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFiles}
        />
        <Button
          variant="hero"
          onClick={() => inputRef.current?.click()}
          disabled={progress !== null}
        >
          {progress ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          {progress ?? "Select photos from gallery"}
        </Button>
      </div>

      <div className="glass-panel space-y-4 rounded-3xl p-6">
        <h2 className="font-display text-xl font-bold">Add a video (by link)</h2>
        <p className="text-sm text-muted-foreground">
          Upload the video to YouTube (can be Unlisted), Google Drive, or any host that gives you a
          shareable link, then paste it here.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="video-url">Video link</Label>
            <Input
              id="video-url"
              className="mt-2"
              value={videoUrl}
              onChange={(event) => setVideoUrl(event.target.value)}
              placeholder="https://youtube.com/watch?v=... or https://...mp4"
            />
          </div>
          <div>
            <Label htmlFor="video-title">Title</Label>
            <Input
              id="video-title"
              className="mt-2"
              value={videoTitle}
              onChange={(event) => setVideoTitle(event.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>
        <Button
          variant="hero"
          onClick={() => addVideo.mutate()}
          disabled={!videoUrl.trim() || addVideo.isPending}
        >
          {addVideo.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Add video
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : media.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {media.map((item) => (
            <div key={item.id} className="glass-panel overflow-hidden rounded-2xl">
              <div className="aspect-video bg-secondary">
                {item.type === "video" ? (
                  youtubeEmbedUrl(item.url) ? (
                    <iframe
                      src={youtubeEmbedUrl(item.url) ?? undefined}
                      title={item.title}
                      className="size-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video src={item.url} controls className="size-full object-cover" />
                  )
                ) : (
                  <img
                    src={item.url}
                    alt={item.title}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                )}
              </div>
              <div className="flex items-start justify-between gap-2 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.type} · {item.category}
                    {item.published === false ? " · hidden" : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={item.published === false ? "Show on website" : "Hide from website"}
                    onClick={() => toggle.mutate(item)}
                  >
                    {item.published === false ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${item.title}`}
                    onClick={() => remove.mutate(item)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No gallery media yet — upload your first photo or video above.
        </p>
      )}
    </div>
  );
}
