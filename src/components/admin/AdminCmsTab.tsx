import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveSetting, seedDefaultContent, uploadLogo } from "@/lib/cms";
import { pickText, useSettings } from "@/lib/use-site-data";

export function AdminCmsTab() {
  const { data: settings, isLoading } = useSettings();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    business_name: "",
    logo_url: "",
    description: "",
    email: "",
    phone: "",
    hero_title: "",
    hero_subtitle: "",
    about_title: "",
    about_description: "",
  });

  useEffect(() => {
    if (!settings) return;
    setForm({
      business_name: pickText(settings, "footer", "business_name", ""),
      logo_url: pickText(settings, "footer", "logo_url", ""),
      description: pickText(settings, "footer", "description", ""),
      email: pickText(settings, "footer", "email", ""),
      phone: pickText(settings, "footer", "phone", ""),
      hero_title: pickText(settings, "hero", "title", ""),
      hero_subtitle: pickText(settings, "hero", "subtitle", ""),
      about_title: pickText(settings, "about", "title", ""),
      about_description: pickText(settings, "about", "description", ""),
    });
  }, [settings]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["site_settings"] });

  const save = useMutation({
    mutationFn: async () => {
      await saveSetting("footer", {
        business_name: form.business_name,
        logo_url: form.logo_url,
        description: form.description,
        email: form.email,
        phone: form.phone,
      });
      await saveSetting("hero", { title: form.hero_title, subtitle: form.hero_subtitle });
      await saveSetting("about", {
        title: form.about_title,
        description: form.about_description,
      });
    },
    onSuccess: () => {
      toast.success("Website details updated");
      invalidate();
    },
    onError: () => toast.error("Could not save these changes"),
  });

  const seed = useMutation({
    mutationFn: seedDefaultContent,
    onSuccess: () => {
      toast.success("Starter content loaded into your database");
      queryClient.invalidateQueries();
    },
    onError: () => toast.error("Could not load starter content"),
  });

  async function handleLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadLogo(file);
      setForm((current) => ({ ...current, logo_url: url }));
      toast.success("Logo uploaded");
      invalidate();
    } catch {
      toast.error("Logo upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value })),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="glass-panel space-y-5 rounded-3xl p-6">
        <h2 className="font-display text-xl font-bold">Studio identity</h2>
        <div>
          <Label htmlFor="business_name">Studio name</Label>
          <Input id="business_name" className="mt-2" maxLength={80} {...field("business_name")} />
        </div>
        <div>
          <Label htmlFor="description">Short description</Label>
          <Textarea id="description" className="mt-2" rows={3} {...field("description")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="email">Contact email</Label>
            <Input id="email" type="email" className="mt-2" {...field("email")} />
          </div>
          <div>
            <Label htmlFor="phone">Contact phone</Label>
            <Input id="phone" className="mt-2" {...field("phone")} />
          </div>
        </div>

        <h2 className="pt-2 font-display text-xl font-bold">Homepage hero</h2>
        <div>
          <Label htmlFor="hero_title">Hero title</Label>
          <Input id="hero_title" className="mt-2" {...field("hero_title")} />
        </div>
        <div>
          <Label htmlFor="hero_subtitle">Hero subtitle</Label>
          <Textarea id="hero_subtitle" className="mt-2" rows={3} {...field("hero_subtitle")} />
        </div>

        <h2 className="pt-2 font-display text-xl font-bold">About section</h2>
        <div>
          <Label htmlFor="about_title">About title</Label>
          <Input id="about_title" className="mt-2" {...field("about_title")} />
        </div>
        <div>
          <Label htmlFor="about_description">About description</Label>
          <Textarea
            id="about_description"
            className="mt-2"
            rows={4}
            {...field("about_description")}
          />
        </div>

        <Button variant="hero" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Save website details
        </Button>
      </div>

      <div className="space-y-6">
        <div className="glass-panel space-y-4 rounded-3xl p-6">
          <h2 className="font-display text-xl font-bold">Studio logo</h2>
          {form.logo_url ? (
            <img
              src={form.logo_url}
              alt="Current studio logo"
              className="size-24 rounded-2xl border object-cover"
            />
          ) : (
            <p className="text-sm text-muted-foreground">No logo uploaded yet.</p>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogo}
          />
          <Button variant="glass" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Upload new logo
          </Button>
          <p className="text-xs text-muted-foreground">
            Compressed and stored as base64 in Firestore — no Firebase Storage needed.
          </p>
        </div>

        <div className="glass-panel space-y-3 rounded-3xl p-6">
          <h2 className="font-display text-xl font-bold">Starter content</h2>
          <p className="text-sm text-muted-foreground">
            Writes the default services, offers, FAQs and section text into your database so you can
            edit them instead of starting from scratch.
          </p>
          <Button variant="glass" onClick={() => seed.mutate()} disabled={seed.isPending}>
            {seed.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Load starter content
          </Button>
        </div>
      </div>
    </div>
  );
}
