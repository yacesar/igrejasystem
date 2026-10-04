"use client";

import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Select,
  Textarea,
} from "@mca/ui";
import { GENDERS, MARITAL_STATUSES, PERSON_STATUSES } from "@mca/validators";
import Link from "next/link";
import { useActionState } from "react";
import type { ActionResult } from "@/server/actions/_result";
import { STATUS_LABELS } from "./status-badge";

export interface CampusOption {
  id: string;
  name: string;
  kind: "sede" | "congregacao";
}

export interface PersonFormValues {
  id?: string;
  fullName?: string;
  preferredName?: string | null;
  gender?: string;
  birthDate?: string | null;
  maritalStatus?: string;
  cpf?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  status?: string;
  campusId?: string;
  profession?: string | null;
  notes?: string | null;
  address?: Record<string, unknown> | null;
}

interface Props {
  action: (state: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  campuses: CampusOption[];
  campusLabel: string;
  initial?: PersonFormValues;
  submitLabel: string;
  cancelHref: string;
}

const GENDER_LABEL: Record<string, string> = {
  feminino: "Feminino",
  masculino: "Masculino",
  nao_informado: "Não informado",
};
const MARITAL_LABEL: Record<string, string> = {
  solteiro: "Solteiro(a)",
  casado: "Casado(a)",
  uniao_estavel: "União estável",
  divorciado: "Divorciado(a)",
  viuvo: "Viúvo(a)",
  nao_informado: "Não informado",
};

export function PersonForm({
  action,
  campuses,
  campusLabel,
  initial,
  submitLabel,
  cancelHref,
}: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const addr = (initial?.address ?? {}) as Record<string, string | undefined>;

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      {state && !state.ok ? <Alert tone="danger">{state.error}</Alert> : null}

      <Card>
        <CardHeader>
          <CardTitle>Dados principais</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Nome completo"
            htmlFor="fullName"
            required
            error={errors.fullName}
            className="sm:col-span-2"
          >
            <Input
              name="fullName"
              defaultValue={initial?.fullName ?? ""}
              autoComplete="name"
              autoFocus={!initial}
            />
          </Field>
          <Field
            label="Como prefere ser chamado(a)"
            htmlFor="preferredName"
            error={errors.preferredName}
          >
            <Input name="preferredName" defaultValue={initial?.preferredName ?? ""} />
          </Field>
          <Field label={campusLabel} htmlFor="campusId" required error={errors.campusId}>
            <Select name="campusId" defaultValue={initial?.campusId ?? campuses[0]?.id}>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Situação" htmlFor="status" required error={errors.status}>
            <Select name="status" defaultValue={initial?.status ?? "visitante"}>
              {PERSON_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Data de nascimento" htmlFor="birthDate" error={errors.birthDate}>
            <Input type="date" name="birthDate" defaultValue={initial?.birthDate ?? ""} />
          </Field>
          <Field label="Sexo" htmlFor="gender" error={errors.gender}>
            <Select name="gender" defaultValue={initial?.gender ?? "nao_informado"}>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {GENDER_LABEL[g]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Estado civil" htmlFor="maritalStatus" error={errors.maritalStatus}>
            <Select name="maritalStatus" defaultValue={initial?.maritalStatus ?? "nao_informado"}>
              {MARITAL_STATUSES.map((m) => (
                <option key={m} value={m}>
                  {MARITAL_LABEL[m]}
                </option>
              ))}
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contato e documentos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="WhatsApp" htmlFor="whatsapp" error={errors.whatsapp} hint="Com DDD">
            <Input
              name="whatsapp"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(21) 98765-4321"
              defaultValue={initial?.whatsapp ?? ""}
            />
          </Field>
          <Field label="Telefone" htmlFor="phone" error={errors.phone}>
            <Input name="phone" inputMode="tel" defaultValue={initial?.phone ?? ""} />
          </Field>
          <Field label="E-mail" htmlFor="email" error={errors.email}>
            <Input
              type="email"
              name="email"
              inputMode="email"
              autoComplete="email"
              defaultValue={initial?.email ?? ""}
            />
          </Field>
          <Field label="CPF" htmlFor="cpf" error={errors.cpf}>
            <Input
              name="cpf"
              inputMode="numeric"
              placeholder="000.000.000-00"
              defaultValue={initial?.cpf ?? ""}
            />
          </Field>
          <Field
            label="Profissão"
            htmlFor="profession"
            error={errors.profession}
            className="sm:col-span-2"
          >
            <Input name="profession" defaultValue={initial?.profession ?? ""} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-6">
          <Field
            label="CEP"
            htmlFor="address.cep"
            error={errors["address.cep"]}
            className="sm:col-span-2"
          >
            <Input
              name="address.cep"
              inputMode="numeric"
              placeholder="00000-000"
              defaultValue={addr.cep ?? ""}
            />
          </Field>
          <Field label="Rua" htmlFor="address.street" className="sm:col-span-4">
            <Input
              name="address.street"
              autoComplete="address-line1"
              defaultValue={addr.street ?? ""}
            />
          </Field>
          <Field label="Número" htmlFor="address.number" className="sm:col-span-1">
            <Input name="address.number" defaultValue={addr.number ?? ""} />
          </Field>
          <Field label="Complemento" htmlFor="address.complement" className="sm:col-span-2">
            <Input name="address.complement" defaultValue={addr.complement ?? ""} />
          </Field>
          <Field label="Bairro" htmlFor="address.district" className="sm:col-span-3">
            <Input name="address.district" defaultValue={addr.district ?? ""} />
          </Field>
          <Field label="Cidade" htmlFor="address.city" className="sm:col-span-4">
            <Input
              name="address.city"
              autoComplete="address-level2"
              defaultValue={addr.city ?? ""}
            />
          </Field>
          <Field
            label="UF"
            htmlFor="address.state"
            error={errors["address.state"]}
            className="sm:col-span-2"
          >
            <Input
              name="address.state"
              maxLength={2}
              placeholder="RJ"
              defaultValue={addr.state ?? ""}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <Field
            label="Anotações gerais"
            htmlFor="notes"
            hint="Visível para a secretaria. Nada confidencial aqui."
            error={errors.notes}
          >
            <Textarea name="notes" defaultValue={initial?.notes ?? ""} />
          </Field>
        </CardContent>
      </Card>

      <div className="sticky bottom-[calc(var(--bottom-nav-h)+0.5rem)] z-10 flex gap-2 rounded-lg border border-border bg-bg-elevated/95 p-2 shadow-md backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none">
        <Button type="submit" size="lg" loading={pending} className="flex-1 md:flex-none">
          {submitLabel}
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href={cancelHref as never}>Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
