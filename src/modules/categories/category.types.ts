export interface CategoryAttribute {
  name?: string;
  type?: string;
  options?: string[];
}

export interface CategoryBody {
  name?: string;
  slug?: string;
  parentId?: string | null;
  attributes?: CategoryAttribute[];
  isActive?: boolean;
}

export interface CategoryListQuery {
  parentId?: string;
}
