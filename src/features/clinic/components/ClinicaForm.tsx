'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { atualizarClinica } from '@/features/clinic/services/clinica-client';
import { editarClinicaSchema } from '@/features/clinic/schemas';
import type { Clinica } from '@/features/clinic/types';

export interface ClinicaFormProps {
  clinica: Clinica;
}

interface CamposErro {
  nome?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  logo_url?: string;
}

export function ClinicaForm({ clinica }: ClinicaFormProps) {
  const router = useRouter();

  const [nome, setNome] = useState(clinica.nome);
  const [email, setEmail] = useState(clinica.email);
  const [telefone, setTelefone] = useState(clinica.telefone ?? '');
  const [endereco, setEndereco] = useState(clinica.endereco ?? '');
  const [logoUrl, setLogoUrl] = useState(clinica.logo_url ?? '');
  const [erros, setErros] = useState<CamposErro>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    setErroGeral(null);
    setSucesso(false);

    const resultado = editarClinicaSchema.safeParse({
      nome,
      email,
      telefone,
      endereco,
      logo_url: logoUrl,
    });

    if (!resultado.success) {
      const novosErros: CamposErro = {};
      for (const issue of resultado.error.issues) {
        const campo = issue.path[0] as keyof CamposErro;
        novosErros[campo] = issue.message;
      }
      setErros(novosErros);
      return;
    }

    setErros({});
    setSalvando(true);

    const resposta = await atualizarClinica(clinica.id, resultado.data);

    setSalvando(false);

    if (!resposta.sucesso) {
      setErroGeral(resposta.erro ?? 'Não foi possível salvar.');
      return;
    }

    setSucesso(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input
        id="nome"
        label="Nome da clínica"
        value={nome}
        onChange={(evento) => setNome(evento.target.value)}
        erro={erros.nome}
        required
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          id="email"
          label="E-mail"
          type="email"
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          erro={erros.email}
          required
        />

        <Input
          id="telefone"
          label="Telefone (opcional)"
          value={telefone}
          onChange={(evento) => setTelefone(evento.target.value)}
          erro={erros.telefone}
        />
      </div>

      <Input
        id="endereco"
        label="Endereço (opcional)"
        value={endereco}
        onChange={(evento) => setEndereco(evento.target.value)}
        erro={erros.endereco}
      />

      <Input
        id="logo_url"
        label="URL do logo (opcional)"
        placeholder="https://..."
        value={logoUrl}
        onChange={(evento) => setLogoUrl(evento.target.value)}
        erro={erros.logo_url}
        dica={!erros.logo_url ? 'Cole o link de uma imagem já hospedada.' : undefined}
      />

      {erroGeral ? <Alert tom="erro">{erroGeral}</Alert> : null}
      {sucesso ? <Alert tom="sucesso">Dados atualizados com sucesso.</Alert> : null}

      <Button type="submit" disabled={salvando} className="gap-2 self-start">
        <Save className="size-4" aria-hidden />
        {salvando ? 'Salvando...' : 'Salvar alterações'}
      </Button>
    </form>
  );
}

