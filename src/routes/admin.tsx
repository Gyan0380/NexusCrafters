import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldAlert } from "lucide-react";
import { useEffect } from "react";
import { AdminCmsTab } from "@/components/admin/AdminCmsTab";
import { AdminPortfolioTab } from "@/components/admin/AdminPortfolioTab";
import { AdminProjectsTab } from "@/components/admin/AdminProjectsTab";
import { AdminRequestsTab } from "@/components/admin/AdminRequestsTab";
import { AdminServicesTab } from "@/components/admin/AdminServicesTab";
import { AdminTeamTab } from "@/components/admin/AdminTeamTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin")({
  // Firebase Auth is browser-only, so this dashboard renders client-side.
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Dashboard | NexusCrafters" },
      { name: "description", content: "Private studio dashboard for requests, content and media." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate({ to: "/", replace: true });
    }
  }, [loading, isAdmin, navigate]);

  if (loading) {
    return (
      <SiteLayout>
        <div className="container-page flex min-h-[60vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </SiteLayout>
    );
  }

  if (!isAdmin) {
    return (
      <SiteLayout>
        <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
          <ShieldAlert className="size-8 text-destructive" aria-hidden />
          <p className="text-sm text-muted-foreground">Redirecting…</p>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="container-page py-12">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Admin dashboard
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Studio control centre
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Manage incoming requests, website content, services and your portfolio gallery.
          </p>
        </header>

        <Tabs defaultValue="requests">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="cms">CMS</TabsTrigger>
            <TabsTrigger value="services">Services & Offers</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="pt-6">
            <AdminRequestsTab />
          </TabsContent>
          <TabsContent value="cms" className="pt-6">
            <AdminCmsTab />
          </TabsContent>
          <TabsContent value="services" className="pt-6">
            <AdminServicesTab />
          </TabsContent>
          <TabsContent value="portfolio" className="pt-6">
            <AdminPortfolioTab />
          </TabsContent>
          <TabsContent value="team" className="pt-6">
            <AdminTeamTab />
          </TabsContent>
          <TabsContent value="projects" className="pt-6">
            <AdminProjectsTab />
          </TabsContent>
        </Tabs>
      </section>
    </SiteLayout>
  );
}
