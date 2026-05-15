export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      credit_purchases: {
        Row: {
          id: string
          user_id: string
          credits_amount: number
          price_mzn: number
          payment_method: string
          reference_code: string
          proof_url: string | null
          status: string
          admin_notes: string | null
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          credits_amount: number
          price_mzn: number
          payment_method: string
          reference_code: string
          proof_url?: string | null
          status?: string
          admin_notes?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          credits_amount?: number
          price_mzn?: number
          payment_method?: string
          reference_code?: string
          proof_url?: string | null
          status?: string
          admin_notes?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      hero_images: {
        Row: {
          id: string
          title: string | null
          subtitle: string | null
          cta_label: string | null
          cta_url: string | null
          image_url: string
          position: number
          active: boolean
          page: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title?: string | null
          subtitle?: string | null
          cta_label?: string | null
          cta_url?: string | null
          image_url: string
          position?: number
          active?: boolean
          page?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string | null
          subtitle?: string | null
          cta_label?: string | null
          cta_url?: string | null
          image_url?: string
          position?: number
          active?: boolean
          page?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      delivery_zones: {
        Row: {
          active: boolean
          estimated_time: string | null
          fee: number
          id: string
          name: string
          neighborhoods: string[]
        }
        Insert: {
          active?: boolean
          estimated_time?: string | null
          fee?: number
          id?: string
          name: string
          neighborhoods?: string[]
        }
        Update: {
          active?: boolean
          estimated_time?: string | null
          fee?: number
          id?: string
          name?: string
          neighborhoods?: string[]
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          item_type: string
          name: string
          order_id: string
          product_id: string | null
          quantity: number
          specs: Json
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          item_type: string
          name: string
          order_id: string
          product_id?: string | null
          quantity?: number
          specs?: Json
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          item_type?: string
          name?: string
          order_id?: string
          product_id?: string | null
          quantity?: number
          specs?: Json
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          delivery_fee: number
          delivery_type: string
          delivery_zone_id: string | null
          id: string
          neighborhood: string
          notes: string | null
          order_number: string
          payment_method: string
          reference_point: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          delivery_fee?: number
          delivery_type: string
          delivery_zone_id?: string | null
          id?: string
          neighborhood: string
          notes?: string | null
          order_number?: string
          payment_method?: string
          reference_point?: string | null
          status?: string
          subtotal: number
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_fee?: number
          delivery_type?: string
          delivery_zone_id?: string | null
          id?: string
          neighborhood?: string
          notes?: string | null
          order_number?: string
          payment_method?: string
          reference_point?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_delivery_zone_id_fkey"
            columns: ["delivery_zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          active: boolean
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          type: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          type: string
        }
        Update: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          type?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          brand: string | null
          category_id: string | null
          compare_price: number | null
          created_at: string
          description: string | null
          discount_percent: number
          featured: boolean
          free_shipping: boolean
          height_cm: number | null
          id: string
          image_url: string | null
          international_shipping_fee: number | null
          length_cm: number | null
          name: string
          price: number
          rating: number
          review_count: number
          sales_count: number
          seller_id: string | null
          seller_name: string | null
          shipping_fee: number | null
          shipping_origin: string
          shipping_type: string
          specs: Json
          stock: number
          unit: string
          updated_at: string
          weight_kg: number | null
          width_cm: number | null
        }
        Insert: {
          active?: boolean
          brand?: string | null
          category_id?: string | null
          compare_price?: number | null
          created_at?: string
          description?: string | null
          discount_percent?: number
          featured?: boolean
          free_shipping?: boolean
          height_cm?: number | null
          id?: string
          image_url?: string | null
          international_shipping_fee?: number | null
          length_cm?: number | null
          name: string
          price: number
          rating?: number
          review_count?: number
          sales_count?: number
          seller_id?: string | null
          seller_name?: string | null
          shipping_fee?: number | null
          shipping_origin?: string
          shipping_type?: string
          specs?: Json
          stock?: number
          unit?: string
          updated_at?: string
          weight_kg?: number | null
          width_cm?: number | null
        }
        Update: {
          active?: boolean
          brand?: string | null
          category_id?: string | null
          compare_price?: number | null
          created_at?: string
          description?: string | null
          discount_percent?: number
          featured?: boolean
          free_shipping?: boolean
          height_cm?: number | null
          id?: string
          image_url?: string | null
          international_shipping_fee?: number | null
          length_cm?: number | null
          name?: string
          price?: number
          rating?: number
          review_count?: number
          sales_count?: number
          seller_id?: string | null
          seller_name?: string | null
          shipping_fee?: number | null
          shipping_origin?: string
          shipping_type?: string
          specs?: Json
          stock?: number
          unit?: string
          updated_at?: string
          weight_kg?: number | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_scholarships: {
        Row: {
          id: string
          title: string
          country: string
          flag: string
          level: string
          area: string
          coverage: string
          language: string
          deadline: string
          institution: string
          description: string | null
          apply_url: string
          benefits: string[]
          requirements: string[]
          process_steps: string[]
          documents: string[]
          tips: string[]
          featured: boolean
          active: boolean
          created_at: string
          content_rich: string | null
          guides: Json
          materials: Json
          image_url: string | null
          comments_enabled: boolean
          allow_applications: boolean
          views: number
          applications_count: number
        }
        Insert: {
          id: string
          title: string
          country: string
          flag?: string
          level: string
          area: string
          coverage: string
          language: string
          deadline: string
          institution: string
          description?: string | null
          apply_url: string
          benefits?: string[]
          requirements?: string[]
          process_steps?: string[]
          documents?: string[]
          tips?: string[]
          featured?: boolean
          active?: boolean
          created_at?: string
          content_rich?: string | null
          guides?: Json
          materials?: Json
          image_url?: string | null
          comments_enabled?: boolean
          allow_applications?: boolean
          views?: number
          applications_count?: number
        }
        Update: {
          id?: string
          title?: string
          country?: string
          flag?: string
          level?: string
          area?: string
          coverage?: string
          language?: string
          deadline?: string
          institution?: string
          description?: string | null
          apply_url?: string
          benefits?: string[]
          requirements?: string[]
          process_steps?: string[]
          documents?: string[]
          tips?: string[]
          featured?: boolean
          active?: boolean
          created_at?: string
          content_rich?: string | null
          guides?: Json
          materials?: Json
          image_url?: string | null
          comments_enabled?: boolean
          allow_applications?: boolean
          views?: number
          applications_count?: number
        }
        Relationships: []
      }
      bolsa_comments: {
        Row: {
          id: string
          scholarship_id: string
          user_id: string
          parent_id: string | null
          content: string
          author_name: string
          is_admin: boolean
          helpful_count: number
          approved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          scholarship_id: string
          user_id: string
          parent_id?: string | null
          content: string
          author_name?: string
          is_admin?: boolean
          helpful_count?: number
          approved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          scholarship_id?: string
          user_id?: string
          parent_id?: string | null
          content?: string
          author_name?: string
          is_admin?: boolean
          helpful_count?: number
          approved?: boolean
          created_at?: string
        }
        Relationships: []
      }
      bolsa_applications: {
        Row: {
          id: string
          scholarship_id: string
          user_id: string | null
          name: string
          email: string
          whatsapp: string
          course: string | null
          university: string | null
          documents_have: string[]
          help_needed: string[]
          notes: string | null
          status: string
          admin_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          scholarship_id: string
          user_id?: string | null
          name: string
          email: string
          whatsapp: string
          course?: string | null
          university?: string | null
          documents_have?: string[]
          help_needed?: string[]
          notes?: string | null
          status?: string
          admin_notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          scholarship_id?: string
          user_id?: string | null
          name?: string
          email?: string
          whatsapp?: string
          course?: string | null
          university?: string | null
          documents_have?: string[]
          help_needed?: string[]
          notes?: string | null
          status?: string
          admin_notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          id: string
          email: string
          source: string
          subscribed_at: string
        }
        Insert: {
          id?: string
          email: string
          source?: string
          subscribed_at?: string
        }
        Update: {
          id?: string
          email?: string
          source?: string
          subscribed_at?: string
        }
        Relationships: []
      }
      hub_documents: {
        Row: {
          id: string
          title: string
          author: string
          category: string
          pages: number
          description: string
          tags: string[]
          file_url: string | null
          cover_hue: number
          premium: boolean
          published: boolean
          downloads: number
          views: number
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          author?: string
          category: string
          pages?: number
          description?: string
          tags?: string[]
          file_url?: string | null
          cover_hue?: number
          premium?: boolean
          published?: boolean
          downloads?: number
          views?: number
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          author?: string
          category?: string
          pages?: number
          description?: string
          tags?: string[]
          file_url?: string | null
          cover_hue?: number
          premium?: boolean
          published?: boolean
          downloads?: number
          views?: number
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      hub_generated_letters: {
        Row: {
          id: string
          user_id: string
          letter_type: string
          title: string
          content: string
          form_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          letter_type: string
          title: string
          content: string
          form_data?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          letter_type?: string
          title?: string
          content?: string
          form_data?: Json
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          body: string | null
          link: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          body?: string | null
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          body?: string | null
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          hub_credits: number
          hub_premium: boolean
          id: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          hub_credits?: number
          hub_premium?: boolean
          id: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          hub_credits?: number
          hub_premium?: boolean
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          id: string
          slug: string
          title: string
          date: string
          category: string
          image_url: string | null
          excerpt: string | null
          meta_title: string | null
          meta_description: string | null
          keywords: string | null
          tags: string[] | null
          content: Json
          published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          date?: string
          category?: string
          image_url?: string | null
          excerpt?: string | null
          meta_title?: string | null
          meta_description?: string | null
          keywords?: string | null
          tags?: string[] | null
          content?: Json
          published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          date?: string
          category?: string
          image_url?: string | null
          excerpt?: string | null
          meta_title?: string | null
          meta_description?: string | null
          keywords?: string | null
          tags?: string[] | null
          content?: Json
          published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          product_id: string
          user_id: string
          order_id: string | null
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          order_id?: string | null
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          order_id?: string | null
          rating?: number
          comment?: string | null
          created_at?: string
        }
        Relationships: []
      }
      unified_comments: {
        Row: {
          id: string
          content_type: string
          content_id: string
          user_id: string
          parent_id: string | null
          content: string
          author_name: string
          is_admin: boolean
          helpful_count: number
          approved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          content_type: string
          content_id: string
          user_id: string
          parent_id?: string | null
          content: string
          author_name?: string
          is_admin?: boolean
          helpful_count?: number
          approved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          content_type?: string
          content_id?: string
          user_id?: string
          parent_id?: string | null
          content?: string
          author_name?: string
          is_admin?: boolean
          helpful_count?: number
          approved?: boolean
          created_at?: string
        }
        Relationships: []
      }
      help_requests: {
        Row: {
          id: string
          content_type: string
          content_id: string
          user_id: string | null
          name: string
          email: string
          whatsapp: string
          help_needed: string[]
          notes: string | null
          status: string
          admin_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          content_type: string
          content_id: string
          user_id?: string | null
          name: string
          email: string
          whatsapp: string
          help_needed?: string[]
          notes?: string | null
          status?: string
          admin_notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          content_type?: string
          content_id?: string
          user_id?: string | null
          name?: string
          email?: string
          whatsapp?: string
          help_needed?: string[]
          notes?: string | null
          status?: string
          admin_notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      hub_exams: {
        Row: {
          id: string
          title: string
          institution: string
          course: string
          year: number
          subjects: string[]
          difficulty: string
          description: string | null
          content_rich: string | null
          guides: Json
          materials: Json
          tips: string[]
          image_url: string | null
          file_url: string | null
          solution_url: string | null
          active: boolean
          featured: boolean
          comments_enabled: boolean
          allow_registrations: boolean
          registration_url: string | null
          registration_deadline: string | null
          registration_fee: string | null
          views: number
          downloads: number
          created_at: string
        }
        Insert: {
          id: string
          title: string
          institution: string
          course: string
          year?: number
          subjects?: string[]
          difficulty?: string
          description?: string | null
          content_rich?: string | null
          guides?: Json
          materials?: Json
          tips?: string[]
          image_url?: string | null
          file_url?: string | null
          solution_url?: string | null
          active?: boolean
          featured?: boolean
          comments_enabled?: boolean
          allow_registrations?: boolean
          registration_url?: string | null
          registration_deadline?: string | null
          registration_fee?: string | null
          views?: number
          downloads?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          institution?: string
          course?: string
          year?: number
          subjects?: string[]
          difficulty?: string
          description?: string | null
          content_rich?: string | null
          guides?: Json
          materials?: Json
          tips?: string[]
          image_url?: string | null
          file_url?: string | null
          solution_url?: string | null
          active?: boolean
          featured?: boolean
          comments_enabled?: boolean
          allow_registrations?: boolean
          registration_url?: string | null
          registration_deadline?: string | null
          registration_fee?: string | null
          views?: number
          downloads?: number
          created_at?: string
        }
        Relationships: []
      }
      hub_news: {
        Row: {
          id: string
          title: string
          excerpt: string | null
          category: string
          author: string
          date: string
          image_url: string | null
          content_rich: string | null
          content: string[] | null
          related_scholarship_id: string | null
          tags: string[]
          published: boolean
          comments_enabled: boolean
          views: number
          created_at: string
        }
        Insert: {
          id: string
          title: string
          excerpt?: string | null
          category?: string
          author?: string
          date?: string
          image_url?: string | null
          content_rich?: string | null
          content?: string[] | null
          related_scholarship_id?: string | null
          tags?: string[]
          published?: boolean
          comments_enabled?: boolean
          views?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          excerpt?: string | null
          category?: string
          author?: string
          date?: string
          image_url?: string | null
          content_rich?: string | null
          content?: string[] | null
          related_scholarship_id?: string | null
          tags?: string[]
          published?: boolean
          comments_enabled?: boolean
          views?: number
          created_at?: string
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          category: Database["public"]["Enums"]["service_category"]
          created_at: string
          description: string
          id: string
          status: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["service_category"]
          created_at?: string
          description: string
          id?: string
          status?: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["service_category"]
          created_at?: string
          description?: string
          id?: string
          status?: Database["public"]["Enums"]["request_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gallery_items: {
        Row: {
          id: string
          url: string
          title: string
          description: string
          client: string
          category: string
          rating: number
          before_url: string | null
          project_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          url: string
          title?: string
          description?: string
          client?: string
          category?: string
          rating?: number
          before_url?: string | null
          project_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          url?: string
          title?: string
          description?: string
          client?: string
          category?: string
          rating?: number
          before_url?: string | null
          project_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      gallery_projects: {
        Row: {
          id: string
          title: string
          slug: string
          client_name: string | null
          client_testimonial: string | null
          category: string
          description: string
          challenge: string | null
          solution: string | null
          results: string | null
          technologies: string[] | null
          project_url: string | null
          project_date: string | null
          is_featured: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          client_name?: string | null
          client_testimonial?: string | null
          category: string
          description?: string
          challenge?: string | null
          solution?: string | null
          results?: string | null
          technologies?: string[] | null
          project_url?: string | null
          project_date?: string | null
          is_featured?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          client_name?: string | null
          client_testimonial?: string | null
          category?: string
          description?: string
          challenge?: string | null
          solution?: string | null
          results?: string | null
          technologies?: string[] | null
          project_url?: string | null
          project_date?: string | null
          is_featured?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          id: string
          project_id: string
          image_url: string
          thumbnail_url: string | null
          title: string | null
          description: string | null
          step_order: number
          step_label: string | null
          is_cover: boolean
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          image_url: string
          thumbnail_url?: string | null
          title?: string | null
          description?: string | null
          step_order?: number
          step_label?: string | null
          is_cover?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          image_url?: string
          thumbnail_url?: string | null
          title?: string | null
          description?: string | null
          step_order?: number
          step_label?: string | null
          is_cover?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "gallery_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_campaigns: {
        Row: {
          id: string
          subject: string
          body_html: string
          sent_to: number
          failed: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          subject: string
          body_html: string
          sent_to?: number
          failed?: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          subject?: string
          body_html?: string
          sent_to?: number
          failed?: number
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          id: string
          endpoint: string
          p256dh: string
          auth: string
          user_id: string | null
          role: string
          device_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          endpoint: string
          p256dh: string
          auth: string
          user_id?: string | null
          role?: string
          device_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          user_id?: string | null
          role?: string
          device_name?: string | null
          created_at?: string
        }
        Relationships: []
      }
      push_notifications_log: {
        Row: {
          id: string
          title: string
          body: string
          url: string
          target_type: string
          target_user_id: string | null
          sent_count: number
          failed_count: number
          removed_count: number
          created_by: string | null
          sent_at: string
        }
        Insert: {
          id?: string
          title: string
          body: string
          url?: string
          target_type?: string
          target_user_id?: string | null
          sent_count?: number
          failed_count?: number
          removed_count?: number
          created_by?: string | null
          sent_at?: string
        }
        Update: {
          id?: string
          title?: string
          body?: string
          url?: string
          target_type?: string
          target_user_id?: string | null
          sent_count?: number
          failed_count?: number
          removed_count?: number
          created_by?: string | null
          sent_at?: string
        }
        Relationships: []
      }
      prices: {
        Row: {
          id: string
          service: string
          description: string | null
          price: number
          unit: string | null
          category: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          service: string
          description?: string | null
          price: number
          unit?: string | null
          category?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          service?: string
          description?: string | null
          price?: number
          unit?: string | null
          category?: string | null
          active?: boolean
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_notification: {
        Args: {
          p_user_id: string
          p_type: string
          p_title: string
          p_body?: string | null
          p_link?: string | null
        }
        Returns: string
      }
      mark_notifications_read: {
        Args: { p_ids: string[] }
        Returns: undefined
      }
    }
    Enums: {
      request_status: "pending" | "in_progress" | "completed" | "cancelled"
      service_category:
        | "reprografia"
        | "informatica"
        | "redes"
        | "papelaria"
        | "design"
        | "outro"
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
      request_status: ["pending", "in_progress", "completed", "cancelled"],
      service_category: [
        "reprografia",
        "informatica",
        "redes",
        "papelaria",
        "design",
        "outro",
      ],
    },
  },
} as const
