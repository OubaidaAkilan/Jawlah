export interface Student {
  id: string;
  student_photo: string | null;
  full_name: string;
  age: number;
  student_phone_number: string | null;
  school_name: string;
  grade: string;
  parent_name: string;
  parent_phone_number: string;
  home_address: string;
  google_maps_link: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  snapchat_url: string | null;
  notes: string | null;
  is_delete: boolean;
  created_at: string;
  updated_at: string;
}

export type StudentInsert = Omit<Student, 'id' | 'is_delete' | 'created_at' | 'updated_at'>;
export type StudentUpdate = Partial<StudentInsert>;
