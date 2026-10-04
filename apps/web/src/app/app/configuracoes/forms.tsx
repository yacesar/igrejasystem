"use client";

import { Alert, Button, Field, Input } from "@mca/ui";
import { Plus } from "lucide-react";
import { useActionState } from "react";
import { createCampus, updateChurchBasics } from "@/server/actions/campuses";

export function ChurchForm({
  name,
  shortName,
  brandColor,
}: {
  name: string;
  shortName: string | null;
  brandColor: string | null;
}) {
  const [state, action, pending] = useActionState(updateChurchBasics, null);
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2" noValidate>
      {state && !state.ok ? (
        <Alert tone="danger" className="sm:col-span-2">
          {state.error}
        </Alert>
      ) : null}
      {state?.ok ? (
        <Alert tone="success" className="sm:col-span-2">
          Salvo.
        </Alert>
      ) : null}
      <Field label="Nome" htmlFor="name" required error={errors.name} className="sm:col-span-2">
        <Input name="name" defaultValue={name} />
      </Field>
      <Field label="Nome curto" htmlFor="shortName" error={errors.shortName}>
        <Input name="shortName" defaultValue={shortName ?? ""} />
      </Field>
      <Field
        label="Matiz da cor da marca"
        htmlFor="brandColor"
        hint="0 a 360 (ex.: 252 azul, 150 verde, 25 vermelho)"
        error={errors.brandColor}
      >
        <Input
          name="brandColor"
          inputMode="numeric"
          defaultValue={brandColor ?? ""}
          placeholder="252"
        />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" loading={pending}>
          Salvar
        </Button>
      </div>
    </form>
  );
}

export function CampusForm({ label }: { label: string }) {
  const [state, action, pending] = useActionState(createCampus, null);
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row sm:items-end" noValidate>
      <Field
        label={`Nova ${label.toLowerCase()}`}
        htmlFor="name"
        error={errors.name ?? (state && !state.ok ? state.error : undefined)}
        className="flex-1"
      >
        <Input name="name" placeholder={`Nome da ${label.toLowerCase()}`} />
      </Field>
      <Button type="submit" variant="secondary" loading={pending}>
        <Plus aria-hidden /> Adicionar
      </Button>
    </form>
  );
}
