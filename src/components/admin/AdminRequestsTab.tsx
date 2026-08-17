import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Inbox, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteContactRequest } from "@/lib/cms";
import { useContactRequests } from "@/lib/use-site-data";

export function AdminRequestsTab() {
  const { data: requests = [], isLoading } = useContactRequests();
  const queryClient = useQueryClient();

  const remove = useMutation({
    mutationFn: (id: string) => deleteContactRequest(id),
    onSuccess: () => {
      toast.success("Request deleted");
      queryClient.invalidateQueries({ queryKey: ["contact_requests"] });
    },
    onError: () => toast.error("Could not delete this request"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!requests.length) {
    return (
      <div className="glass-panel flex flex-col items-center gap-3 rounded-3xl p-12 text-center">
        <Inbox className="size-8 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">
          No contact requests yet. Submissions from the contact page appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel overflow-x-auto rounded-3xl p-2 sm:p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Service / Package</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-medium">{request.name}</TableCell>
              <TableCell>
                <a className="text-primary hover:underline" href={`mailto:${request.email}`}>
                  {request.email}
                </a>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {[request.service, request.package].filter(Boolean).join(" · ") || "—"}
                {request.budget ? <div className="text-xs">Budget: {request.budget}</div> : null}
              </TableCell>
              <TableCell className="max-w-[280px] whitespace-pre-wrap text-sm text-muted-foreground">
                {request.requirements || request.message || "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                {new Date(request.created_at).toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete request from ${request.name}`}
                  onClick={() => remove.mutate(request.id)}
                  disabled={remove.isPending}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
