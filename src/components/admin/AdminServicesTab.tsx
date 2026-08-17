import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  deletePackage,
  deleteService,
  formatPrice,
  listToText,
  savePackage,
  saveService,
  slugify,
  textToList,
  type PricingPackage,
  type Service,
} from "@/lib/cms";
import { usePackages, useServices } from "@/lib/use-site-data";

type ServiceDraft = {
  id?: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  starting_price: string;
  featuresText: string;
  active: boolean;
  display_order: number;
};

type PackageDraft = {
  id?: string;
  service_id: string;
  name: string;
  price: number;
  price_suffix: string;
  description: string;
  featuresText: string;
  popular: boolean;
  active: boolean;
  display_order: number;
};

function serviceToDraft(service: Service): ServiceDraft {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    category: service.category,
    icon: service.icon,
    starting_price: service.starting_price,
    featuresText: listToText(service.features),
    active: service.active !== false,
    display_order: service.display_order ?? 0,
  };
}

function packageToDraft(pkg: PricingPackage): PackageDraft {
  return {
    id: pkg.id,
    service_id: pkg.service_id ?? "",
    name: pkg.name,
    price: Number(pkg.price ?? 0),
    price_suffix: pkg.price_suffix ?? "",
    description: pkg.description ?? "",
    featuresText: listToText(pkg.features),
    popular: Boolean(pkg.popular),
    active: pkg.active !== false,
    display_order: pkg.display_order ?? 0,
  };
}

export function AdminServicesTab() {
  const { data: services = [], isLoading } = useServices(true);
  const { data: packages = [] } = usePackages(true);
  const queryClient = useQueryClient();
  const [serviceDraft, setServiceDraft] = useState<ServiceDraft | null>(null);
  const [packageDraft, setPackageDraft] = useState<PackageDraft | null>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["services"] });
    queryClient.invalidateQueries({ queryKey: ["packages"] });
  };

  const persistService = useMutation({
    mutationFn: async (draft: ServiceDraft) => {
      await saveService({
        ...(draft.id ? { id: draft.id } : {}),
        name: draft.name,
        slug: slugify(draft.name),
        description: draft.description,
        category: draft.category || "other",
        icon: draft.icon || "Sparkles",
        starting_price: draft.starting_price,
        features: textToList(draft.featuresText),
        active: draft.active,
        display_order: Number(draft.display_order) || 0,
      });
    },
    onSuccess: () => {
      toast.success("Service saved");
      setServiceDraft(null);
      refresh();
    },
    onError: () => toast.error("Could not save this service"),
  });

  const removeService = useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      toast.success("Service deleted");
      refresh();
    },
    onError: () => toast.error("Could not delete this service"),
  });

  const persistPackage = useMutation({
    mutationFn: async (draft: PackageDraft) => {
      await savePackage({
        ...(draft.id ? { id: draft.id } : {}),
        service_id: draft.service_id || null,
        name: draft.name,
        price: Number(draft.price) || 0,
        price_suffix: draft.price_suffix,
        description: draft.description,
        features: textToList(draft.featuresText),
        popular: draft.popular,
        active: draft.active,
        display_order: Number(draft.display_order) || 0,
      });
    },
    onSuccess: () => {
      toast.success("Offer saved");
      setPackageDraft(null);
      refresh();
    },
    onError: () => toast.error("Could not save this offer"),
  });

  const removePackage = useMutation({
    mutationFn: deletePackage,
    onSuccess: () => {
      toast.success("Offer deleted");
      refresh();
    },
    onError: () => toast.error("Could not delete this offer"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold">Services</h2>
          <Button
            variant="hero"
            size="sm"
            onClick={() =>
              setServiceDraft({
                name: "",
                description: "",
                category: "websites",
                icon: "Sparkles",
                starting_price: "",
                featuresText: "",
                active: true,
                display_order: services.length + 1,
              })
            }
          >
            <Plus className="size-4" /> Add service
          </Button>
        </div>

        {serviceDraft ? (
          <div className="glass-panel space-y-4 rounded-3xl p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="svc-name">Name</Label>
                <Input
                  id="svc-name"
                  className="mt-2"
                  value={serviceDraft.name}
                  onChange={(event) =>
                    setServiceDraft({ ...serviceDraft, name: event.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="svc-price">Starting price label</Label>
                <Input
                  id="svc-price"
                  className="mt-2"
                  placeholder="₹120"
                  value={serviceDraft.starting_price}
                  onChange={(event) =>
                    setServiceDraft({ ...serviceDraft, starting_price: event.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="svc-category">Category key</Label>
                <Input
                  id="svc-category"
                  className="mt-2"
                  value={serviceDraft.category}
                  onChange={(event) =>
                    setServiceDraft({ ...serviceDraft, category: event.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="svc-icon">Lucide icon name</Label>
                <Input
                  id="svc-icon"
                  className="mt-2"
                  value={serviceDraft.icon}
                  onChange={(event) =>
                    setServiceDraft({ ...serviceDraft, icon: event.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="svc-description">Description</Label>
              <Textarea
                id="svc-description"
                rows={3}
                className="mt-2"
                value={serviceDraft.description}
                onChange={(event) =>
                  setServiceDraft({ ...serviceDraft, description: event.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="svc-features">Features (one per line)</Label>
              <Textarea
                id="svc-features"
                rows={4}
                className="mt-2"
                value={serviceDraft.featuresText}
                onChange={(event) =>
                  setServiceDraft({ ...serviceDraft, featuresText: event.target.value })
                }
              />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={serviceDraft.active}
                  onChange={(event) =>
                    setServiceDraft({ ...serviceDraft, active: event.target.checked })
                  }
                />
                Visible on the website
              </label>
              <div className="flex items-center gap-2 text-sm">
                <Label htmlFor="svc-order">Order</Label>
                <Input
                  id="svc-order"
                  type="number"
                  className="w-20"
                  value={serviceDraft.display_order}
                  onChange={(event) =>
                    setServiceDraft({ ...serviceDraft, display_order: Number(event.target.value) })
                  }
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="hero"
                onClick={() => persistService.mutate(serviceDraft)}
                disabled={persistService.isPending || !serviceDraft.name.trim()}
              >
                <Save className="size-4" /> Save service
              </Button>
              <Button variant="ghost" onClick={() => setServiceDraft(null)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          {services.map((service) => (
            <div key={service.id} className="glass-panel rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{service.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {service.category} · from {service.starting_price || "—"}
                    {service.active === false ? " · hidden" : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setServiceDraft(serviceToDraft(service))}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${service.name}`}
                    onClick={() => removeService.mutate(service.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold">Offers & packages</h2>
          <Button
            variant="hero"
            size="sm"
            onClick={() =>
              setPackageDraft({
                service_id: services[0]?.id ?? "",
                name: "",
                price: 0,
                price_suffix: "",
                description: "",
                featuresText: "",
                popular: false,
                active: true,
                display_order: packages.length + 1,
              })
            }
          >
            <Plus className="size-4" /> Add offer
          </Button>
        </div>

        {packageDraft ? (
          <div className="glass-panel space-y-4 rounded-3xl p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="pkg-name">Offer name</Label>
                <Input
                  id="pkg-name"
                  className="mt-2"
                  value={packageDraft.name}
                  onChange={(event) =>
                    setPackageDraft({ ...packageDraft, name: event.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="pkg-service">Service</Label>
                <select
                  id="pkg-service"
                  className="mt-2 h-9 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm"
                  value={packageDraft.service_id}
                  onChange={(event) =>
                    setPackageDraft({ ...packageDraft, service_id: event.target.value })
                  }
                >
                  <option value="">No specific service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="pkg-price">Price (₹)</Label>
                <Input
                  id="pkg-price"
                  type="number"
                  className="mt-2"
                  value={packageDraft.price}
                  onChange={(event) =>
                    setPackageDraft({ ...packageDraft, price: Number(event.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="pkg-suffix">Price suffix</Label>
                <Input
                  id="pkg-suffix"
                  className="mt-2"
                  placeholder="+"
                  value={packageDraft.price_suffix}
                  onChange={(event) =>
                    setPackageDraft({ ...packageDraft, price_suffix: event.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="pkg-description">Description</Label>
              <Textarea
                id="pkg-description"
                rows={2}
                className="mt-2"
                value={packageDraft.description}
                onChange={(event) =>
                  setPackageDraft({ ...packageDraft, description: event.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="pkg-features">Features (one per line)</Label>
              <Textarea
                id="pkg-features"
                rows={4}
                className="mt-2"
                value={packageDraft.featuresText}
                onChange={(event) =>
                  setPackageDraft({ ...packageDraft, featuresText: event.target.value })
                }
              />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={packageDraft.popular}
                  onChange={(event) =>
                    setPackageDraft({ ...packageDraft, popular: event.target.checked })
                  }
                />
                Mark as most popular
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={packageDraft.active}
                  onChange={(event) =>
                    setPackageDraft({ ...packageDraft, active: event.target.checked })
                  }
                />
                Visible on the website
              </label>
              <div className="flex items-center gap-2">
                <Label htmlFor="pkg-order">Order</Label>
                <Input
                  id="pkg-order"
                  type="number"
                  className="w-20"
                  value={packageDraft.display_order}
                  onChange={(event) =>
                    setPackageDraft({ ...packageDraft, display_order: Number(event.target.value) })
                  }
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="hero"
                onClick={() => persistPackage.mutate(packageDraft)}
                disabled={persistPackage.isPending || !packageDraft.name.trim()}
              >
                <Save className="size-4" /> Save offer
              </Button>
              <Button variant="ghost" onClick={() => setPackageDraft(null)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {packages.map((pkg) => (
            <div key={pkg.id} className="glass-panel rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{pkg.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(pkg)}
                    {pkg.popular ? " · popular" : ""}
                    {pkg.active === false ? " · hidden" : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPackageDraft(packageToDraft(pkg))}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${pkg.name}`}
                    onClick={() => removePackage.mutate(pkg.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{pkg.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
