"use client";

import { Button } from "@mca/ui";
import { Archive } from "lucide-react";
import { useTransition } from "react";
import { archivePerson } from "@/server/actions/people";

export function ArchiveButton({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border-strong px-4 py-3">
      <p className="text-sm text-fg-muted">
        Arquivar remove a pessoa das listas, mas preserva o histórico para auditoria.
      </p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-danger hover:bg-danger-soft"
        loading={pending}
        onClick={() => {
          if (confirm(`Arquivar ${name}? Esta ação pode ser revertida pela administração.`)) {
            start(async () => {
              await archivePerson(id);
            });
          }
        }}
      >
        <Archive aria-hidden /> Arquivar
      </Button>
    </div>
  );
}
