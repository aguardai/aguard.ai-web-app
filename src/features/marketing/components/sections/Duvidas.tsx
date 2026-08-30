import { EtiquetaSecao } from '@/features/marketing/components/ui/EtiquetaSecao';
import { ItemDuvida } from '@/features/marketing/components/ui/ItemDuvida';

const PERGUNTAS = [
  {
    pergunta: 'O paciente precisa instalar algum aplicativo?',
    resposta:
      'Não. Ele lê o QR Code da recepção, preenche nome e telefone e já entra na fila pelo navegador. O acompanhamento da posição também é por link, sem cadastro nem senha.',
  },
  {
    pergunta: 'Preciso trocar o sistema que já uso na clínica?',
    resposta:
      'Não. O Aguard.ai cuida só da fila e do painel de chamada. Ele convive com o seu prontuário e com a sua agenda, sem substituir nada.',
  },
  {
    pergunta: 'Como funciona o acesso das unidades e dos profissionais?',
    resposta:
      'A administração da clínica cadastra as unidades, os guichês e os profissionais. Cada unidade entra com o próprio acesso e enxerga apenas a fila dela. O profissional vê somente os pacientes encaminhados para ele.',
  },
  {
    pergunta: 'O que acontece quando o paciente não comparece?',
    resposta:
      'A atendente marca como ausente. Ele pode voltar para o fim da fila com um clique ou ser cancelado de vez, e tudo fica registrado no histórico.',
  },
  {
    pergunta: 'O plano gratuito expira?',
    resposta:
      'Não. O Starter é gratuito enquanto a operação couber nos limites dele: uma unidade, dois guichês, três profissionais e 500 atendimentos por mês.',
  },
  {
    pergunta: 'Posso trocar de plano depois?',
    resposta:
      'Sim, a qualquer momento. Os limites passam a valer na hora e nenhum dado é perdido na mudança.',
  },
];

export function Duvidas() {
  return (
    <section id="duvidas" className="bg-muted-bg py-20 sm:py-28">
      <div className="content-container max-w-3xl">
        <div className="text-center">
          <EtiquetaSecao>Dúvidas</EtiquetaSecao>
          <h2 className="mt-3 font-title text-3xl leading-tight font-bold text-foreground sm:text-4xl">
            Perguntas frequentes
          </h2>
        </div>

        <div className="mt-10 flex flex-col gap-3">
          {PERGUNTAS.map(({ pergunta, resposta }) => (
            <ItemDuvida key={pergunta} pergunta={pergunta} resposta={resposta} />
          ))}
        </div>
      </div>
    </section>
  );
}
