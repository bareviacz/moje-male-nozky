// Vygenerováno ze Supabase (projekt chjpgalnmarmxuqmlzup). Po změně databáze: npm run types:db
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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      bazar_favorites: {
        Row: { created_at: string; listing_id: string; user_id: string }
        Insert: { created_at?: string; listing_id: string; user_id: string }
        Update: { created_at?: string; listing_id?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: "bazar_favorites_listing_id_fkey"; columns: ["listing_id"]; isOneToOne: false; referencedRelation: "bazar_listings"; referencedColumns: ["id"] },
          { foreignKeyName: "bazar_favorites_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      bazar_listing_photos: {
        Row: { created_at: string; id: string; kind: Database["public"]["Enums"]["bazar_photo_kind"]; listing_id: string; position: number; storage_path: string }
        Insert: { created_at?: string; id?: string; kind?: Database["public"]["Enums"]["bazar_photo_kind"]; listing_id: string; position?: number; storage_path: string }
        Update: { created_at?: string; id?: string; kind?: Database["public"]["Enums"]["bazar_photo_kind"]; listing_id?: string; position?: number; storage_path?: string }
        Relationships: [
          { foreignKeyName: "bazar_listing_photos_listing_id_fkey"; columns: ["listing_id"]; isOneToOne: false; referencedRelation: "bazar_listings"; referencedColumns: ["id"] },
        ]
      }
      bazar_listings: {
        Row: {
          brand: string
          category: string
          condition: Database["public"]["Enums"]["bazar_condition"]
          created_at: string
          description: string | null
          gender: Database["public"]["Enums"]["bazar_gender"]
          id: string
          inner_length_mm: number
          inner_width_mm: number | null
          model: string | null
          price_czk: number
          seller_id: string
          size_eu: number
          source_shoe_id: string | null
          status: Database["public"]["Enums"]["bazar_listing_status"]
          title: string
          updated_at: string
          width: Database["public"]["Enums"]["bazar_width"]
        }
        Insert: {
          brand: string
          category: string
          condition: Database["public"]["Enums"]["bazar_condition"]
          created_at?: string
          description?: string | null
          gender?: Database["public"]["Enums"]["bazar_gender"]
          id?: string
          inner_length_mm: number
          inner_width_mm?: number | null
          model?: string | null
          price_czk: number
          seller_id: string
          size_eu: number
          source_shoe_id?: string | null
          status?: Database["public"]["Enums"]["bazar_listing_status"]
          title: string
          updated_at?: string
          width?: Database["public"]["Enums"]["bazar_width"]
        }
        Update: {
          brand?: string
          category?: string
          condition?: Database["public"]["Enums"]["bazar_condition"]
          created_at?: string
          description?: string | null
          gender?: Database["public"]["Enums"]["bazar_gender"]
          id?: string
          inner_length_mm?: number
          inner_width_mm?: number | null
          model?: string | null
          price_czk?: number
          seller_id?: string
          size_eu?: number
          source_shoe_id?: string | null
          status?: Database["public"]["Enums"]["bazar_listing_status"]
          title?: string
          updated_at?: string
          width?: Database["public"]["Enums"]["bazar_width"]
        }
        Relationships: [
          { foreignKeyName: "bazar_listings_category_fkey"; columns: ["category"]; isOneToOne: false; referencedRelation: "shoe_categories"; referencedColumns: ["code"] },
          { foreignKeyName: "bazar_listings_seller_id_fkey"; columns: ["seller_id"]; isOneToOne: false; referencedRelation: "bazar_sellers"; referencedColumns: ["user_id"] },
          { foreignKeyName: "bazar_listings_source_shoe_id_fkey"; columns: ["source_shoe_id"]; isOneToOne: false; referencedRelation: "shoes"; referencedColumns: ["id"] },
        ]
      }
      bazar_messages: {
        Row: { body: string; created_at: string; id: string; listing_id: string; read_at: string | null; recipient_id: string; sender_id: string }
        Insert: { body: string; created_at?: string; id?: string; listing_id: string; read_at?: string | null; recipient_id: string; sender_id: string }
        Update: { body?: string; created_at?: string; id?: string; listing_id?: string; read_at?: string | null; recipient_id?: string; sender_id?: string }
        Relationships: [
          { foreignKeyName: "bazar_messages_listing_id_fkey"; columns: ["listing_id"]; isOneToOne: false; referencedRelation: "bazar_listings"; referencedColumns: ["id"] },
          { foreignKeyName: "bazar_messages_recipient_id_fkey"; columns: ["recipient_id"]; isOneToOne: false; referencedRelation: "bazar_sellers"; referencedColumns: ["user_id"] },
          { foreignKeyName: "bazar_messages_sender_id_fkey"; columns: ["sender_id"]; isOneToOne: false; referencedRelation: "bazar_sellers"; referencedColumns: ["user_id"] },
        ]
      }
      bazar_orders: {
        Row: {
          buyer_email: string
          buyer_id: string
          buyer_name: string
          buyer_phone: string | null
          comgate_trans_id: string | null
          created_at: string
          id: string
          listing_id: string
          packeta_barcode: string | null
          packeta_packet_id: string | null
          pickup_point_id: string
          pickup_point_name: string
          price_czk: number
          seller_id: string
          shipping_czk: number
          status: Database["public"]["Enums"]["bazar_order_status"]
          submission_code: string | null
          updated_at: string
        }
        Insert: {
          buyer_email: string
          buyer_id: string
          buyer_name: string
          buyer_phone?: string | null
          comgate_trans_id?: string | null
          created_at?: string
          id?: string
          listing_id: string
          packeta_barcode?: string | null
          packeta_packet_id?: string | null
          pickup_point_id: string
          pickup_point_name: string
          price_czk: number
          seller_id: string
          shipping_czk: number
          status?: Database["public"]["Enums"]["bazar_order_status"]
          submission_code?: string | null
          updated_at?: string
        }
        Update: {
          buyer_email?: string
          buyer_id?: string
          buyer_name?: string
          buyer_phone?: string | null
          comgate_trans_id?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          packeta_barcode?: string | null
          packeta_packet_id?: string | null
          pickup_point_id?: string
          pickup_point_name?: string
          price_czk?: number
          seller_id?: string
          shipping_czk?: number
          status?: Database["public"]["Enums"]["bazar_order_status"]
          submission_code?: string | null
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "bazar_orders_buyer_id_fkey"; columns: ["buyer_id"]; isOneToOne: false; referencedRelation: "bazar_sellers"; referencedColumns: ["user_id"] },
          { foreignKeyName: "bazar_orders_listing_id_fkey"; columns: ["listing_id"]; isOneToOne: false; referencedRelation: "bazar_listings"; referencedColumns: ["id"] },
          { foreignKeyName: "bazar_orders_seller_id_fkey"; columns: ["seller_id"]; isOneToOne: false; referencedRelation: "bazar_sellers"; referencedColumns: ["user_id"] },
        ]
      }
      bazar_reports: {
        Row: { created_at: string; id: string; listing_id: string | null; reason: string; reporter_id: string | null; resolved: boolean }
        Insert: { created_at?: string; id?: string; listing_id?: string | null; reason: string; reporter_id?: string | null; resolved?: boolean }
        Update: { created_at?: string; id?: string; listing_id?: string | null; reason?: string; reporter_id?: string | null; resolved?: boolean }
        Relationships: [
          { foreignKeyName: "bazar_reports_listing_id_fkey"; columns: ["listing_id"]; isOneToOne: false; referencedRelation: "bazar_listings"; referencedColumns: ["id"] },
        ]
      }
      bazar_reviews: {
        Row: { comment: string | null; created_at: string; id: string; order_id: string; rating: number; reviewee_id: string; reviewer_id: string }
        Insert: { comment?: string | null; created_at?: string; id?: string; order_id: string; rating: number; reviewee_id: string; reviewer_id: string }
        Update: { comment?: string | null; created_at?: string; id?: string; order_id?: string; rating?: number; reviewee_id?: string; reviewer_id?: string }
        Relationships: [
          { foreignKeyName: "bazar_reviews_order_id_fkey"; columns: ["order_id"]; isOneToOne: true; referencedRelation: "bazar_orders"; referencedColumns: ["id"] },
        ]
      }
      bazar_seller_private: {
        Row: { bank_account: string; phone: string | null; updated_at: string; user_id: string }
        Insert: { bank_account: string; phone?: string | null; updated_at?: string; user_id: string }
        Update: { bank_account?: string; phone?: string | null; updated_at?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: "bazar_seller_private_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "bazar_sellers"; referencedColumns: ["user_id"] },
        ]
      }
      bazar_sellers: {
        Row: { city: string | null; created_at: string; is_admin: boolean; is_barevia: boolean; nickname: string; updated_at: string; user_id: string }
        Insert: { city?: string | null; created_at?: string; is_admin?: boolean; is_barevia?: boolean; nickname: string; updated_at?: string; user_id: string }
        Update: { city?: string | null; created_at?: string; is_admin?: boolean; is_barevia?: boolean; nickname?: string; updated_at?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: "bazar_sellers_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      child_guardians: {
        Row: {
          child_id: string
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          child_id: string
          created_at?: string
          role?: string
          user_id: string
        }
        Update: {
          child_id?: string
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_guardians_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_guardians_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "season_reminders"
            referencedColumns: ["child_id"]
          },
          {
            foreignKeyName: "child_guardians_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          avatar_path: string | null
          birth_date: string
          created_at: string
          created_by: string
          id: string
          name: string
          note: string | null
          sex: string | null
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          birth_date: string
          created_at?: string
          created_by?: string
          id?: string
          name: string
          note?: string | null
          sex?: string | null
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          birth_date?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          note?: string | null
          sex?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      foot_measurements: {
        Row: {
          child_id: string
          created_at: string
          created_by: string | null
          id: string
          left_length_mm: number | null
          left_width_mm: number | null
          measured_at: string
          method: string | null
          note: string | null
          photo_path: string | null
          right_length_mm: number | null
          right_width_mm: number | null
          updated_at: string
        }
        Insert: {
          child_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          left_length_mm?: number | null
          left_width_mm?: number | null
          measured_at?: string
          method?: string | null
          note?: string | null
          photo_path?: string | null
          right_length_mm?: number | null
          right_width_mm?: number | null
          updated_at?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          left_length_mm?: number | null
          left_width_mm?: number | null
          measured_at?: string
          method?: string | null
          note?: string | null
          photo_path?: string | null
          right_length_mm?: number | null
          right_width_mm?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "foot_measurements_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "foot_measurements_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "season_reminders"
            referencedColumns: ["child_id"]
          },
          {
            foreignKeyName: "foot_measurements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      shoe_categories: {
        Row: {
          code: string
          created_at: string
          eshop_url: string | null
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          eshop_url?: string | null
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          eshop_url?: string | null
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      shoe_purchase_windows: {
        Row: {
          category: string
          created_at: string
          end_day: number
          end_month: number
          id: string
          remind_days_before: number
          start_day: number
          start_month: number
        }
        Insert: {
          category: string
          created_at?: string
          end_day: number
          end_month: number
          id?: string
          remind_days_before?: number
          start_day: number
          start_month: number
        }
        Update: {
          category?: string
          created_at?: string
          end_day?: number
          end_month?: number
          id?: string
          remind_days_before?: number
          start_day?: number
          start_month?: number
        }
        Relationships: [
          {
            foreignKeyName: "shoe_purchase_windows_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "shoe_categories"
            referencedColumns: ["code"]
          },
        ]
      }
      shoes: {
        Row: {
          brand: string | null
          category: string | null
          child_id: string
          created_at: string
          created_by: string | null
          eu_size: number | null
          id: string
          inner_length_mm: number | null
          inner_width_mm: number | null
          model: string | null
          note: string | null
          photo_path: string | null
          photo_path_2: string | null
          purchased_at: string | null
          retired_at: string | null
          shoptet_product_code: string | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          child_id: string
          created_at?: string
          created_by?: string | null
          eu_size?: number | null
          id?: string
          inner_length_mm?: number | null
          inner_width_mm?: number | null
          model?: string | null
          note?: string | null
          photo_path?: string | null
          photo_path_2?: string | null
          purchased_at?: string | null
          retired_at?: string | null
          shoptet_product_code?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          child_id?: string
          created_at?: string
          created_by?: string | null
          eu_size?: number | null
          id?: string
          inner_length_mm?: number | null
          inner_width_mm?: number | null
          model?: string | null
          note?: string | null
          photo_path?: string | null
          photo_path_2?: string | null
          purchased_at?: string | null
          retired_at?: string | null
          shoptet_product_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shoes_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "shoe_categories"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "shoes_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shoes_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "season_reminders"
            referencedColumns: ["child_id"]
          },
          {
            foreignKeyName: "shoes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      bazar_seller_ratings: {
        Row: { avg_rating: number | null; review_count: number | null; seller_id: string | null }
        Relationships: []
      }
      child_growth: {
        Row: {
          age_months: number | null
          child_id: string | null
          days_since_previous: number | null
          foot_length_mm: number | null
          foot_width_mm: number | null
          growth_mm: number | null
          left_length_mm: number | null
          measured_at: string | null
          measurement_id: string | null
          right_length_mm: number | null
        }
        Relationships: [
          {
            foreignKeyName: "foot_measurements_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "foot_measurements_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "season_reminders"
            referencedColumns: ["child_id"]
          },
        ]
      }
      season_reminders: {
        Row: {
          category: string | null
          category_name: string | null
          child_id: string | null
          child_name: string | null
          days_since_measurement: number | null
          days_until_start: number | null
          ends_on: string | null
          eshop_url: string | null
          growth_mm_per_month: number | null
          is_open: boolean | null
          last_length_mm: number | null
          last_measured_at: string | null
          predicted_length_mm: number | null
          recommended_inner_max_mm: number | null
          recommended_inner_min_mm: number | null
          remind_days_before: number | null
          starts_on: string | null
          window_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shoe_purchase_windows_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "shoe_categories"
            referencedColumns: ["code"]
          },
        ]
      }
      shoe_fit: {
        Row: {
          brand: string | null
          category: string | null
          child_id: string | null
          eu_size: number | null
          fit_status: string | null
          foot_length_mm: number | null
          inner_length_mm: number | null
          last_measured_at: string | null
          length_reserve_mm: number | null
          model: string | null
          shoe_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shoes_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "shoe_categories"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "shoes_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shoes_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "season_reminders"
            referencedColumns: ["child_id"]
          },
        ]
      }
    }
    Functions: {
      bazar_cancel_order: { Args: { p_order_id: string }; Returns: undefined }
      bazar_confirm_received: { Args: { p_order_id: string }; Returns: undefined }
      bazar_create_order: {
        Args: {
          p_buyer_email: string
          p_buyer_name: string
          p_buyer_phone?: string
          p_listing_id: string
          p_pickup_point_id: string
          p_pickup_point_name: string
        }
        Returns: string
      }
      bazar_get_payment_details: {
        Args: { p_order_id: string }
        Returns: { amount_czk: number; bank_account: string; seller_nickname: string; variable_symbol: string }[]
      }
    }
    Enums: {
      bazar_condition: "jako_nove" | "lehce_nosene" | "nosene" | "hodne_nosene"
      bazar_gender: "unisex" | "holka" | "kluk"
      bazar_listing_status: "koncept" | "aktivni" | "rezervovano" | "prodano" | "skryto"
      bazar_order_status: "ceka_na_postovne" | "postovne_zaplaceno" | "k_odeslani" | "na_ceste" | "doruceno" | "dokonceno" | "zruseno"
      bazar_photo_kind: "celek" | "podrazka" | "stelka" | "detail"
      bazar_width: "uzka" | "normalni" | "siroka"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
