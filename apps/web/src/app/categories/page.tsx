'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { categoriesApi } from '@/lib/categories';
import { Category, CategoryType } from '@/types';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { CategoriesTableSkeleton } from '@/components/CategoriesTableSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ApiException } from '@/lib/api';

type FilterType = 'ALL' | CategoryType;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      loadCategories();
    }
  }, [isAuthenticated]);

  const loadCategories = async () => {
    try {
      const data = await categoriesApi.getAll();
      setCategories(data);
    } catch (error) {
      if (error instanceof ApiException) {
        if (error.statusCode === 401) {
          logout();
          router.push('/login');
          return;
        }
        toast.error(error.message);
      } else {
        toast.error('Failed to load categories');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const matchesSearch = category.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'ALL' || category.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [categories, searchQuery, filterType]);

  const handleDelete = async () => {
    if (!deleteCategory) return;

    setIsDeleting(true);
    try {
      await categoriesApi.delete(deleteCategory.id);
      setCategories((prev) => prev.filter((c) => c.id !== deleteCategory.id));
      toast.success('Category deleted successfully');
      setDeleteCategory(null);
    } catch (error) {
      if (error instanceof ApiException) {
        toast.error(error.message);
      } else {
        toast.error('Failed to delete category');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Categories</h2>
        <Link href="/categories/new">
          <Button>New Category</Button>
        </Link>
      </div>

      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={filterType}
          onValueChange={(value) => setFilterType(value as FilterType)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value={CategoryType.INCOME}>Income</SelectItem>
            <SelectItem value={CategoryType.EXPENSE}>Expense</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg shadow">
        {isLoading ? (
          <CategoriesTableSkeleton />
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No categories yet. Create your first category to get started.
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No categories match your search.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        category.type === 'INCOME'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {category.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(category.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Link href={`/categories/${category.id}/edit`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteCategory(category)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog
        open={!!deleteCategory}
        onOpenChange={() => setDeleteCategory(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteCategory?.name}
              &quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteCategory(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthLayout>
  );
}
