export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      atendimento: {
        Row: {
          atendido_em: string | null
          chamado_em: string | null
          consulta_gerada_id: string | null
          created_at: string
          created_by: string | null
          data_fila: string
          deleted_at: string | null
          deleted_by: string | null
          encaminhar_para_consulta: boolean
          entrada_fila: string
          finalizado_em: string | null
          guiche_id: string | null
          id: string
          numero_senha: number | null
          observacoes: string | null
          paciente_id: string
          posicao: number | null
          prioridade: Database["public"]["Enums"]["prioridade_fila"]
          proximo_profissional_id: string | null
          senha: string | null
          status: Database["public"]["Enums"]["status_fila"]
          tipo_consulta: string | null
          unidade_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          atendido_em?: string | null
          chamado_em?: string | null
          consulta_gerada_id?: string | null
          created_at?: string
          created_by?: string | null
          data_fila?: string
          deleted_at?: string | null
          deleted_by?: string | null
          encaminhar_para_consulta?: boolean
          entrada_fila?: string
          finalizado_em?: string | null
          guiche_id?: string | null
          id?: string
          numero_senha?: number | null
          observacoes?: string | null
          paciente_id: string
          posicao?: number | null
          prioridade?: Database["public"]["Enums"]["prioridade_fila"]
          proximo_profissional_id?: string | null
          senha?: string | null
          status?: Database["public"]["Enums"]["status_fila"]
          tipo_consulta?: string | null
          unidade_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          atendido_em?: string | null
          chamado_em?: string | null
          consulta_gerada_id?: string | null
          created_at?: string
          created_by?: string | null
          data_fila?: string
          deleted_at?: string | null
          deleted_by?: string | null
          encaminhar_para_consulta?: boolean
          entrada_fila?: string
          finalizado_em?: string | null
          guiche_id?: string | null
          id?: string
          numero_senha?: number | null
          observacoes?: string | null
          paciente_id?: string
          posicao?: number | null
          prioridade?: Database["public"]["Enums"]["prioridade_fila"]
          proximo_profissional_id?: string | null
          senha?: string | null
          status?: Database["public"]["Enums"]["status_fila"]
          tipo_consulta?: string | null
          unidade_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atendimento_consulta_gerada_fkey"
            columns: ["consulta_gerada_id"]
            isOneToOne: false
            referencedRelation: "consulta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimento_consulta_gerada_fkey"
            columns: ["consulta_gerada_id"]
            isOneToOne: false
            referencedRelation: "vw_fila_consulta_publica"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "atendimento_guiche_id_fkey"
            columns: ["guiche_id"]
            isOneToOne: false
            referencedRelation: "guiche"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimento_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "paciente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimento_proximo_profissional_id_fkey"
            columns: ["proximo_profissional_id"]
            isOneToOne: false
            referencedRelation: "profissional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimento_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimento_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_unidade"
            referencedColumns: ["unidade_id"]
          },
        ]
      }
      clinica: {
        Row: {
          ativa: boolean
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          email: string
          endereco: string | null
          id: string
          logo_url: string | null
          nome: string
          plano: Database["public"]["Enums"]["plano_clinica"]
          telefone: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ativa?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email: string
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome: string
          plano?: Database["public"]["Enums"]["plano_clinica"]
          telefone?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ativa?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          plano?: Database["public"]["Enums"]["plano_clinica"]
          telefone?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      consulta: {
        Row: {
          atendido_em: string | null
          chamado_em: string | null
          created_at: string
          created_by: string | null
          data_fila: string
          deleted_at: string | null
          deleted_by: string | null
          entrada_fila: string
          finalizado_em: string | null
          id: string
          numero_senha: number | null
          observacoes: string | null
          origem_atendimento_id: string | null
          paciente_id: string
          posicao: number | null
          prioridade: Database["public"]["Enums"]["prioridade_fila"]
          profissional_id: string
          senha: string | null
          status: Database["public"]["Enums"]["status_fila"]
          tipo_consulta: string | null
          unidade_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          atendido_em?: string | null
          chamado_em?: string | null
          created_at?: string
          created_by?: string | null
          data_fila?: string
          deleted_at?: string | null
          deleted_by?: string | null
          entrada_fila?: string
          finalizado_em?: string | null
          id?: string
          numero_senha?: number | null
          observacoes?: string | null
          origem_atendimento_id?: string | null
          paciente_id: string
          posicao?: number | null
          prioridade?: Database["public"]["Enums"]["prioridade_fila"]
          profissional_id: string
          senha?: string | null
          status?: Database["public"]["Enums"]["status_fila"]
          tipo_consulta?: string | null
          unidade_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          atendido_em?: string | null
          chamado_em?: string | null
          created_at?: string
          created_by?: string | null
          data_fila?: string
          deleted_at?: string | null
          deleted_by?: string | null
          entrada_fila?: string
          finalizado_em?: string | null
          id?: string
          numero_senha?: number | null
          observacoes?: string | null
          origem_atendimento_id?: string | null
          paciente_id?: string
          posicao?: number | null
          prioridade?: Database["public"]["Enums"]["prioridade_fila"]
          profissional_id?: string
          senha?: string | null
          status?: Database["public"]["Enums"]["status_fila"]
          tipo_consulta?: string | null
          unidade_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consulta_origem_atendimento_id_fkey"
            columns: ["origem_atendimento_id"]
            isOneToOne: false
            referencedRelation: "atendimento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consulta_origem_atendimento_id_fkey"
            columns: ["origem_atendimento_id"]
            isOneToOne: false
            referencedRelation: "vw_fila_atendimento_publica"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "consulta_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "paciente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consulta_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consulta_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consulta_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_unidade"
            referencedColumns: ["unidade_id"]
          },
        ]
      }
      fila_evento: {
        Row: {
          automatico: boolean
          clinica_id: string | null
          created_at: string
          created_by: string | null
          detalhes: Json
          id: number
          status_de: Database["public"]["Enums"]["status_fila"] | null
          status_para: Database["public"]["Enums"]["status_fila"]
          ticket_id: string
          tipo_fila: Database["public"]["Enums"]["tipo_fila"]
          unidade_id: string | null
        }
        Insert: {
          automatico?: boolean
          clinica_id?: string | null
          created_at?: string
          created_by?: string | null
          detalhes?: Json
          id?: never
          status_de?: Database["public"]["Enums"]["status_fila"] | null
          status_para: Database["public"]["Enums"]["status_fila"]
          ticket_id: string
          tipo_fila: Database["public"]["Enums"]["tipo_fila"]
          unidade_id?: string | null
        }
        Update: {
          automatico?: boolean
          clinica_id?: string | null
          created_at?: string
          created_by?: string | null
          detalhes?: Json
          id?: never
          status_de?: Database["public"]["Enums"]["status_fila"] | null
          status_para?: Database["public"]["Enums"]["status_fila"]
          ticket_id?: string
          tipo_fila?: Database["public"]["Enums"]["tipo_fila"]
          unidade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fila_evento_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fila_evento_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_clinica"
            referencedColumns: ["clinica_id"]
          },
          {
            foreignKeyName: "fila_evento_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "vw_uso_plano"
            referencedColumns: ["clinica_id"]
          },
          {
            foreignKeyName: "fila_evento_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fila_evento_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_unidade"
            referencedColumns: ["unidade_id"]
          },
        ]
      }
      guiche: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          nome: string
          unidade_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          nome: string
          unidade_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          nome?: string
          unidade_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guiche_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guiche_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_unidade"
            referencedColumns: ["unidade_id"]
          },
        ]
      }
      locacao: {
        Row: {
          ativa: boolean
          created_at: string
          created_by: string | null
          data_fim: string | null
          data_inicio: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          profissional_id: string
          unidade_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ativa?: boolean
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          profissional_id: string
          unidade_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ativa?: boolean
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          profissional_id?: string
          unidade_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locacao_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacao_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacao_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_unidade"
            referencedColumns: ["unidade_id"]
          },
        ]
      }
      paciente: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          id: string
          nome: string
          telefone: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: string
          nome: string
          telefone: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: string
          nome?: string
          telefone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      perfil: {
        Row: {
          avatar_url: string | null
          clinica_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          id: string
          nome: string
          papel: Database["public"]["Enums"]["papel_usuario"]
          unidade_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          avatar_url?: string | null
          clinica_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id: string
          nome: string
          papel?: Database["public"]["Enums"]["papel_usuario"]
          unidade_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          avatar_url?: string | null
          clinica_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: string
          nome?: string
          papel?: Database["public"]["Enums"]["papel_usuario"]
          unidade_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perfil_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfil_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_clinica"
            referencedColumns: ["clinica_id"]
          },
          {
            foreignKeyName: "perfil_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "vw_uso_plano"
            referencedColumns: ["clinica_id"]
          },
          {
            foreignKeyName: "perfil_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfil_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_unidade"
            referencedColumns: ["unidade_id"]
          },
        ]
      }
      plano_limite: {
        Row: {
          created_at: string
          max_guiches: number
          max_profissionais: number
          max_tickets_mes: number
          max_unidades: number
          plano: Database["public"]["Enums"]["plano_clinica"]
          preco_mensal_simulado: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          max_guiches: number
          max_profissionais: number
          max_tickets_mes: number
          max_unidades: number
          plano: Database["public"]["Enums"]["plano_clinica"]
          preco_mensal_simulado?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          max_guiches?: number
          max_profissionais?: number
          max_tickets_mes?: number
          max_unidades?: number
          plano?: Database["public"]["Enums"]["plano_clinica"]
          preco_mensal_simulado?: number
          updated_at?: string
        }
        Relationships: []
      }
      profissional: {
        Row: {
          ativo: boolean
          avatar_url: string | null
          clinica_id: string
          codigo: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          duracao_media_minutos: number
          email: string | null
          especialidade: string
          id: string
          nome: string
          registro_profissional: string
          telefone: string | null
          updated_at: string
          updated_by: string | null
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          avatar_url?: string | null
          clinica_id: string
          codigo?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          duracao_media_minutos?: number
          email?: string | null
          especialidade: string
          id?: string
          nome: string
          registro_profissional: string
          telefone?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          avatar_url?: string | null
          clinica_id?: string
          codigo?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          duracao_media_minutos?: number
          email?: string | null
          especialidade?: string
          id?: string
          nome?: string
          registro_profissional?: string
          telefone?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profissional_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profissional_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_clinica"
            referencedColumns: ["clinica_id"]
          },
          {
            foreignKeyName: "profissional_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "vw_uso_plano"
            referencedColumns: ["clinica_id"]
          },
        ]
      }
      unidade: {
        Row: {
          ativa: boolean
          clinica_id: string
          codigo: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          duracao_media_minutos: number
          encaminha_para_consulta: boolean
          endereco: string | null
          id: string
          latitude: number | null
          longitude: number | null
          nome: string
          profissional_padrao_id: string | null
          telefone: string | null
          tipo_servico: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ativa?: boolean
          clinica_id: string
          codigo: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          duracao_media_minutos?: number
          encaminha_para_consulta?: boolean
          endereco?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome: string
          profissional_padrao_id?: string | null
          telefone?: string | null
          tipo_servico?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ativa?: boolean
          clinica_id?: string
          codigo?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          duracao_media_minutos?: number
          encaminha_para_consulta?: boolean
          endereco?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome?: string
          profissional_padrao_id?: string | null
          telefone?: string | null
          tipo_servico?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unidade_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unidade_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_clinica"
            referencedColumns: ["clinica_id"]
          },
          {
            foreignKeyName: "unidade_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "vw_uso_plano"
            referencedColumns: ["clinica_id"]
          },
          {
            foreignKeyName: "unidade_profissional_padrao_id_fkey"
            columns: ["profissional_padrao_id"]
            isOneToOne: false
            referencedRelation: "profissional"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vw_dashboard_clinica: {
        Row: {
          aguardando_agora: number | null
          clinica_id: string | null
          clinica_nome: string | null
          duracao_media_30d: number | null
          espera_media_hoje: number | null
          finalizados_hoje: number | null
          plano: Database["public"]["Enums"]["plano_clinica"] | null
          tickets_hoje: number | null
          total_guiches: number | null
          total_profissionais: number | null
          total_unidades: number | null
        }
        Relationships: []
      }
      vw_dashboard_unidade: {
        Row: {
          aguardando_agora: number | null
          ausentes_hoje: number | null
          cancelados_hoje: number | null
          clinica_id: string | null
          duracao_media_30d: number | null
          espera_media_hoje: number | null
          finalizados_hoje: number | null
          tickets_hoje: number | null
          total_guiches: number | null
          total_profissionais: number | null
          unidade_id: string | null
          unidade_nome: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unidade_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unidade_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_clinica"
            referencedColumns: ["clinica_id"]
          },
          {
            foreignKeyName: "unidade_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "vw_uso_plano"
            referencedColumns: ["clinica_id"]
          },
        ]
      }
      vw_fila_atendimento_publica: {
        Row: {
          chamado_em: string | null
          entrada_fila: string | null
          estimativa_minutos: number | null
          guiche_id: string | null
          guiche_nome: string | null
          paciente: string | null
          posicao: number | null
          prioridade: Database["public"]["Enums"]["prioridade_fila"] | null
          senha: string | null
          status: Database["public"]["Enums"]["status_fila"] | null
          ticket_id: string | null
          tipo_servico: string | null
          unidade_id: string | null
          unidade_nome: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atendimento_guiche_id_fkey"
            columns: ["guiche_id"]
            isOneToOne: false
            referencedRelation: "guiche"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimento_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimento_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_unidade"
            referencedColumns: ["unidade_id"]
          },
        ]
      }
      vw_fila_consulta_publica: {
        Row: {
          chamado_em: string | null
          entrada_fila: string | null
          especialidade: string | null
          estimativa_minutos: number | null
          paciente: string | null
          posicao: number | null
          prioridade: Database["public"]["Enums"]["prioridade_fila"] | null
          profissional_id: string | null
          profissional_nome: string | null
          senha: string | null
          status: Database["public"]["Enums"]["status_fila"] | null
          ticket_id: string | null
          tipo_consulta: string | null
          unidade_id: string | null
          unidade_nome: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consulta_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consulta_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consulta_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_unidade"
            referencedColumns: ["unidade_id"]
          },
        ]
      }
      vw_fila_unificada: {
        Row: {
          atendido_em: string | null
          chamado_em: string | null
          clinica_id: string | null
          entrada_fila: string | null
          guiche_id: string | null
          origem: string | null
          paciente_id: string | null
          paciente_nome: string | null
          paciente_telefone: string | null
          posicao: number | null
          prioridade: Database["public"]["Enums"]["prioridade_fila"] | null
          profissional_id: string | null
          senha: string | null
          status: Database["public"]["Enums"]["status_fila"] | null
          ticket_id: string | null
          tipo_consulta: string | null
          tipo_fila: Database["public"]["Enums"]["tipo_fila"] | null
          unidade_id: string | null
        }
        Relationships: []
      }
      vw_metricas_diarias: {
        Row: {
          ausentes: number | null
          cancelados: number | null
          clinica_id: string | null
          data_fila: string | null
          duracao_media_minutos: number | null
          em_fila: number | null
          espera_media_minutos: number | null
          finalizados: number | null
          tipo_fila: Database["public"]["Enums"]["tipo_fila"] | null
          total_tickets: number | null
          unidade_id: string | null
        }
        Relationships: []
      }
      vw_relatorio_tickets: {
        Row: {
          clinica_id: string | null
          data_fila: string | null
          duracao_minutos: number | null
          entrada_fila: string | null
          espera_minutos: number | null
          finalizado_em: string | null
          gerou_consulta: boolean | null
          guiche_id: string | null
          prioridade: Database["public"]["Enums"]["prioridade_fila"] | null
          profissional_id: string | null
          status: Database["public"]["Enums"]["status_fila"] | null
          ticket_id: string | null
          tipo_fila: Database["public"]["Enums"]["tipo_fila"] | null
          unidade_id: string | null
        }
        Relationships: []
      }
      vw_uso_plano: {
        Row: {
          clinica_id: string | null
          guiches_usados: number | null
          max_guiches: number | null
          max_profissionais: number | null
          max_tickets_mes: number | null
          max_unidades: number | null
          plano: Database["public"]["Enums"]["plano_clinica"] | null
          preco_mensal_simulado: number | null
          profissionais_usados: number | null
          tickets_no_mes: number | null
          unidades_usadas: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      fn_acompanhar_ticket: { Args: { p_ticket_id: string }; Returns: Json }
      fn_atua_na_unidade: { Args: { p_unidade_id: string }; Returns: boolean }
      fn_cancelar_ticket: { Args: { p_ticket_id: string }; Returns: Json }
      fn_chamar_proximo_atendimento: {
        Args: { p_guiche_id: string }
        Returns: {
          atendido_em: string | null
          chamado_em: string | null
          consulta_gerada_id: string | null
          created_at: string
          created_by: string | null
          data_fila: string
          deleted_at: string | null
          deleted_by: string | null
          encaminhar_para_consulta: boolean
          entrada_fila: string
          finalizado_em: string | null
          guiche_id: string | null
          id: string
          numero_senha: number | null
          observacoes: string | null
          paciente_id: string
          posicao: number | null
          prioridade: Database["public"]["Enums"]["prioridade_fila"]
          proximo_profissional_id: string | null
          senha: string | null
          status: Database["public"]["Enums"]["status_fila"]
          tipo_consulta: string | null
          unidade_id: string
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "atendimento"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_chamar_proximo_consulta: {
        Args: { p_profissional_id: string }
        Returns: {
          atendido_em: string | null
          chamado_em: string | null
          created_at: string
          created_by: string | null
          data_fila: string
          deleted_at: string | null
          deleted_by: string | null
          entrada_fila: string
          finalizado_em: string | null
          id: string
          numero_senha: number | null
          observacoes: string | null
          origem_atendimento_id: string | null
          paciente_id: string
          posicao: number | null
          prioridade: Database["public"]["Enums"]["prioridade_fila"]
          profissional_id: string
          senha: string | null
          status: Database["public"]["Enums"]["status_fila"]
          tipo_consulta: string | null
          unidade_id: string
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "consulta"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_clinica_atual: { Args: never; Returns: string }
      fn_duracao_media_profissional: {
        Args: { p_profissional_id: string }
        Returns: number
      }
      fn_duracao_media_unidade: {
        Args: { p_unidade_id: string }
        Returns: number
      }
      fn_e_admin_clinica: { Args: never; Returns: boolean }
      fn_e_admin_unidade: { Args: never; Returns: boolean }
      fn_encerrar_filas_do_dia: { Args: never; Returns: number }
      fn_encerrar_locacoes_vencidas: { Args: never; Returns: number }
      fn_entrar_fila_atendimento: {
        Args: {
          p_email?: string
          p_nome: string
          p_prioridade?: Database["public"]["Enums"]["prioridade_fila"]
          p_telefone: string
          p_unidade_id: string
        }
        Returns: Json
      }
      fn_entrar_fila_consulta: {
        Args: {
          p_email?: string
          p_nome: string
          p_prioridade?: Database["public"]["Enums"]["prioridade_fila"]
          p_profissional_id: string
          p_telefone: string
          p_tipo_consulta?: string
          p_unidade_id: string
        }
        Returns: Json
      }
      fn_estimativa_espera_minutos: {
        Args: {
          p_escopo_id: string
          p_posicao: number
          p_tipo: Database["public"]["Enums"]["tipo_fila"]
        }
        Returns: number
      }
      fn_finalizar_atendimento: {
        Args: {
          p_atendimento_id: string
          p_encaminhar?: boolean
          p_profissional_id?: string
          p_tipo_consulta?: string
        }
        Returns: Json
      }
      fn_gerencia_unidade: { Args: { p_unidade_id: string }; Returns: boolean }
      fn_guiches_ativos: { Args: { p_unidade_id: string }; Returns: number }
      fn_mascarar_nome: { Args: { p_nome: string }; Returns: string }
      fn_paciente_visivel: { Args: { p_paciente_id: string }; Returns: boolean }
      fn_painel_fila_atendimento: {
        Args: { p_unidade_id: string }
        Returns: {
          chamado_em: string
          entrada_fila: string
          estimativa_minutos: number
          guiche_nome: string
          paciente: string
          posicao: number
          prioridade: Database["public"]["Enums"]["prioridade_fila"]
          senha: string
          status: Database["public"]["Enums"]["status_fila"]
          ticket_id: string
        }[]
      }
      fn_painel_fila_consulta: {
        Args: { p_profissional_id: string }
        Returns: {
          chamado_em: string
          entrada_fila: string
          estimativa_minutos: number
          paciente: string
          posicao: number
          prioridade: Database["public"]["Enums"]["prioridade_fila"]
          senha: string
          status: Database["public"]["Enums"]["status_fila"]
          ticket_id: string
          tipo_consulta: string
          unidade_nome: string
        }[]
      }
      fn_profissional_atual: { Args: never; Returns: string }
      fn_profissional_na_unidade: {
        Args: { p_profissional_id: string; p_unidade_id: string }
        Returns: boolean
      }
      fn_recalcular_posicoes_atendimento: {
        Args: { p_data: string; p_unidade_id: string }
        Returns: undefined
      }
      fn_recalcular_posicoes_consulta: {
        Args: { p_data: string; p_profissional_id: string }
        Returns: undefined
      }
      fn_transicao_valida: {
        Args: {
          p_de: Database["public"]["Enums"]["status_fila"]
          p_para: Database["public"]["Enums"]["status_fila"]
        }
        Returns: boolean
      }
      fn_unidade_atual: { Args: never; Returns: string }
      fn_upsert_paciente: {
        Args: { p_email?: string; p_nome: string; p_telefone: string }
        Returns: string
      }
      fn_vincular_usuario: {
        Args: { p_email: string; p_papel: string; p_unidade_id?: string }
        Returns: string
      }
    }
    Enums: {
      papel_usuario: "clinica" | "profissional" | "unidade"
      plano_clinica: "starter" | "pro" | "business" | "enterprise"
      prioridade_fila: "normal" | "preferencial"
      status_fila:
        | "aguardando"
        | "chamado"
        | "em_atendimento"
        | "ausente"
        | "finalizado"
        | "cancelado"
      tipo_fila: "atendimento" | "consulta"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      papel_usuario: ["clinica", "profissional", "unidade"],
      plano_clinica: ["starter", "pro", "business", "enterprise"],
      prioridade_fila: ["normal", "preferencial"],
      status_fila: [
        "aguardando",
        "chamado",
        "em_atendimento",
        "ausente",
        "finalizado",
        "cancelado",
      ],
      tipo_fila: ["atendimento", "consulta"],
    },
  },
} as const
