'use client';

import { cn } from '../lib/utils';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { ComponentPropsWithoutRef, ElementRef, forwardRef, HTMLAttributes } from 'react';
import { X } from 'lucide-react';

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;

export const SheetContent = forwardRef<
  ElementRef<typeof SheetPrimitive.Content>,
  ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & { side?: 'left' | 'right' | 'top' | 'bottom' }
>(({ side = 'right', className, children, ...props }, ref) => (
  <SheetPrimitive.Portal>
    <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-50 bg-white dark:bg-gray-950 shadow-2xl transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
        side === 'right' &&
          'inset-y-0 right-0 h-full w-full sm:max-w-md data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right border-l',
        side === 'left' &&
          'inset-y-0 left-0 h-full w-full sm:max-w-md data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left border-r',
        side === 'top' &&
          'inset-x-0 top-0 data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top border-b',
        side === 'bottom' &&
          'inset-x-0 bottom-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom border-t rounded-t-2xl',
        className,
      )}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-full p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPrimitive.Portal>
));
SheetContent.displayName = 'SheetContent';

export const SheetHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-2 px-6 py-4 border-b border-gray-200 dark:border-gray-800', className)} {...props} />
);
SheetHeader.displayName = 'SheetHeader';

export const SheetTitle = forwardRef<
  ElementRef<typeof SheetPrimitive.Title>,
  ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title ref={ref} className={cn('text-lg font-bold text-gray-900 dark:text-gray-100', className)} {...props} />
));
SheetTitle.displayName = 'SheetTitle';

export const SheetDescription = forwardRef<
  ElementRef<typeof SheetPrimitive.Description>,
  ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description ref={ref} className={cn('text-sm text-gray-500 dark:text-gray-400', className)} {...props} />
));
SheetDescription.displayName = 'SheetDescription';

export const SheetFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-800', className)} {...props} />
);
SheetFooter.displayName = 'SheetFooter';
