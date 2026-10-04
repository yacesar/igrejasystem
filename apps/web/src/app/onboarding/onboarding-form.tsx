"use client";

import { Alert, Button, Card, CardContent, Field, Input, cn } from "@mca/ui";
import { Check } from "lucide-react";
import { useActionState, useState } from "react";
import { slugify } from "@/lib/format";
import { createChurch } from "@/server/actions/onboarding";
import type { ActionResult } from "@/server/actions/_result";

interface PresetOption {
  id: string;
  label: string;
  description: string;
}

const initial: ActionResult | null = null;

export function OnboardingForm({ presets }: { presets: PresetOption[] }) {
  const [state, action, pending] = useActionState(createChurch, initial);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [preset, setPreset] = useState(presets[0]?.id ?? "generico");
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      {state && !state.ok ? <Alert tone="danger">{state.error}</Alert> : null}

      <Card>
        <CardContent className="flex flex-col gap-4">
          <Field label="Nome da igreja" htmlFor="name" required error={errors.name}>
            <Input
              name="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              placeholder="Assembleia de Deus em Mangueiras"
              autoFocus
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Nome curto"
              htmlFor="shortName"
              hint="Aparece no app e nos documentos"
              error={errors.shortName}
            >
              <Input name="shortName" placeholder="ADEMAN" />
            </Field>
            <Field
              label="Endereço no sistema"
              htmlFor="slug"
              required
              hint={slug ? `mca.app/${slug}` : "Letras, números e hífens"}
              error={errors.slug}
            >
              <Input
                name="slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">Tradição e vocabulário</legend>
        <input type="hidden" name="preset" value={preset} />
        {presets.map((p) => {
          const selected = p.id === preset;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id)}
              aria-pressed={selected}
              className={cn(
                "flex items-start gap-3 rounded-lg border bg-bg-elevated p-4 text-left shadow-sm transition-colors",
                selected ? "border-primary ring-2 ring-ring/30" : "border-border hover:bg-bg-muted",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border",
                  selected ? "border-primary bg-primary text-primary-fg" : "border-border-strong",
                )}
                aria-hidden
              >
                {selected ? <Check className="size-3.5" /> : null}
              </span>
              <span>
                <span className="block font-medium">{p.label}</span>
                <span className="block text-sm text-fg-muted">{p.description}</span>
              </span>
            </button>
          );
        })}
      </fieldset>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <Field label="Nome da sede" htmlFor="sedeName" required error={errors.sedeName}>
            <Input name="sedeName" defaultValue="Igreja Sede" />
          </Field>
          <Field
            label="Primeira congregação"
            htmlFor="firstCongregationName"
            hint="Opcional. Outras podem ser adicionadas depois."
            error={errors.firstCongregationName}
          >
            <Input name="firstCongregationName" placeholder="Congregação Bairro Novo" />
          </Field>
        </CardContent>
      </Card>

      <Button type="submit" size="lg" loading={pending}>
        Criar igreja e começar
      </Button>
    </form>
  );
}
