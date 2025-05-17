import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useDeleteAdmin } from '@/hooks/use-users';

interface DeleteAdminDialogProps {
  admin: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
    role: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

const DeleteAdminDialog: React.FC<DeleteAdminDialogProps> = ({
  admin,
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
  const deleteAdminMutation = useDeleteAdmin();

  const handleDelete = async () => {
    try {
      await deleteAdminMutation.mutateAsync(admin.userId);
      
      toast({
        title: 'Success',
        description: 'Administrator deleted successfully.',
      });
      
      onClose();
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete administrator. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Administrator</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this administrator? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="text-sm font-medium">Name:</div>
              <div className="col-span-2">{`${admin.firstName} ${admin.lastName}`}</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-sm font-medium">Email:</div>
              <div className="col-span-2">{admin.email}</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-sm font-medium">Role:</div>
              <div className="col-span-2">
                {admin.role === 'central_admin' ? 'Central Admin' : 'Department Admin'}
              </div>
            </div>
            {admin.department && (
              <div className="grid grid-cols-3 gap-2">
                <div className="text-sm font-medium">Department:</div>
                <div className="col-span-2">{admin.department}</div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleteAdminMutation.isLoading}
          >
            {deleteAdminMutation.isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAdminDialog;
