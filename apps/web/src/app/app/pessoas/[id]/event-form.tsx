"use client";

import { Alert, Button, Field, Input, Select } from "@mca/ui";
import { Plus } from "lucide-react";
import { useActionState, useState } from "react";
import type { ActionResult } from "@/server/actions/_result";
import { addMembershipEvent } from "@/server/actions/people";

interface Props {
  personId: string;
  types: { value: string; label: string; restricted: boolean }[];
  campuses: { id: string; name: string }[];
  defaultCampusId: string;
}

export function EventForm({ personId, types, campuses, defaultCampusId }: Props) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    async (prev: ActionResult | null, fd: FormData) => {
      const result = await addMembershipEvent(prev, fd);
      if (result.ok) setOpen(false); // o formulário é reiniciado pelo React após a action
      return result;
    },
    null,
  );
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  if (!open) {
    return (
      <Button type="button" variant="soft" onClick={() => setOpen(true)}>
        <Plus aria-hidden /> Registrar evento
      </Button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <input type="hidden" name="personId" value={personId} />
      {state && !state.ok ? <Alert tone="danger">{state.error}</Alert> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Evento" htmlFor="type" required error={errors.type}>
          <Select name="type" defaultValue={types[0]?.value}>
            {types.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
                {t.restricted ? " (restrito)" : ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Data" htmlFor="occurredAt" required error={errors.occurredAt}>
          <Input
            type="date"
            name="occurredAt"
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </Field>
        <Field label="Local" htmlFor="campusId" error={errors.campusId}>
          <Select name="campusId" defaultValue={defaultCampusId}>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Observação" htmlFor="details.observacao">
          <Input name="details.observacao" placeholder="Ex.: batizado pelo Pr. João" />
        </Field>
      </div>
      <div className="flex gap-2">
        <Button type="submit" loading={pending}>
          Salvar
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
