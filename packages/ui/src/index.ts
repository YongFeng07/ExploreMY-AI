/**
 * @exploremy/ui — Shared UI component library
 *
 * Design system primitives built on Radix UI + Tailwind CSS.
 * All components are server-compatible by default.
 */

// ── Layout ──
export { BottomNav } from './components/bottom-nav';
export { TopBar } from './components/top-bar';

// ── UI Primitives ──
export { Button, buttonVariants } from './components/button';
export { Input } from './components/input';
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './components/card';
export { Badge, badgeVariants } from './components/badge';
export { Avatar, AvatarImage, AvatarFallback } from './components/avatar';
export { Skeleton } from './components/skeleton';
export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from './components/sheet';
export { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction } from './components/toast';

// ── Shared Components ──
export { EmptyState } from './components/empty-state';
export { StarRating } from './components/star-rating';
export { ErrorBoundary } from './components/error-boundary';
export { CategoryPills } from './components/category-pills';
export { PlaceCard } from './components/place-card';
export { TripCard } from './components/trip-card';

// ── Map Components ──
export { MapContainer } from './components/map-container';
export { MapControls } from './components/map-controls';
export { RouteDisplay } from './components/route-display';
export { LocationCoordinates } from './components/location-coordinates';
export { PermissionPrompt } from './components/permission-prompt';

// ── Utilities ──
export { cn } from './lib/utils';
export { formatCurrency, formatDistance, formatDate, formatDuration } from './lib/formatters';
