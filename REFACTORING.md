# Giggen Refactoring Documentation

This document describes the refactoring completed in FASE 1-4 to improve code organization, maintainability, and type safety.

## Overview

The refactoring introduced a **service layer** and **React Query hooks** to eliminate duplicate code, centralize business logic, and improve data fetching patterns.

---

## Architecture Changes

### Before
- Direct Supabase queries scattered across components and pages
- Duplicate auth logic in every page
- useState/useEffect for all data fetching
- No centralized error handling
- Inconsistent patterns

### After
- **Service Layer**: Centralized business logic in `src/services/`
- **React Query Hooks**: Declarative data fetching with caching
- **Centralized Error Handling**: `src/lib/errorHandler.ts`
- **Consistent Patterns**: All pages follow same structure

---

## Service Layer

Services encapsulate database operations and business logic.

### Available Services

#### `profileService.ts`
```typescript
import { profileService } from '@/services/profileService';

// Get current user and profile
const { user, profile } = await profileService.getCurrentUser();

// Get any user's profile
const profile = await profileService.getProfile(userId);

// Get secure profile (respects privacy settings)
const secureProfile = await profileService.getSecureProfile(userId);

// Update profile
const updated = await profileService.updateProfile(userId, { display_name: 'New Name' });
```

#### `bookingService.ts`
```typescript
import { bookingService } from '@/services/bookingService';

// Get booking by ID
const booking = await bookingService.getById(bookingId);

// Get all user bookings
const bookings = await bookingService.getUserBookings(userId);

// Create booking
const newBooking = await bookingService.create({
  senderId: user.id,
  receiverId: artistId,
  title: 'Concert',
  // ... other fields
});

// Update booking
const updated = await bookingService.update(bookingId, { title: 'Updated Title' });

// Soft delete
const deleted = await bookingService.delete(bookingId, 'Reason');

// Reject booking
await bookingService.reject(bookingId);

// Permanently delete
await bookingService.permanentlyDelete(bookingId);
```

#### `conceptService.ts`
```typescript
import { conceptService } from '@/services/conceptService';

// Get concept by ID
const concept = await conceptService.getById(conceptId, includeDrafts);

// Get user concepts
const concepts = await conceptService.getUserConcepts(userId, includeDrafts);

// Get concept files
const files = await conceptService.getConceptFiles(conceptId);

// Create concept
const newConcept = await conceptService.create({
  maker_id: userId,
  title: 'Workshop',
  // ... other fields
});

// Update concept
const updated = await conceptService.update(conceptId, { price: 5000 });

// Publish concept
const published = await conceptService.publish(conceptId);

// Delete concept
await conceptService.delete(conceptId);
```

#### `eventService.ts`
```typescript
import { eventService } from '@/services/eventService';

// Get all public events
const events = await eventService.getPublicEvents();

// Get upcoming events for user
const upcoming = await eventService.getUpcomingEvents(userId);

// Get event by ID
const event = await eventService.getEventById(eventId);

// Create event
const newEvent = await eventService.createEvent({
  created_by: userId,
  title: 'Concert',
  date: '2024-12-31',
  // ... other fields
});

// Get completed events
const completed = await eventService.getCompletedEvents(userId);
```

---

## React Query Hooks

React Query hooks provide declarative data fetching with caching, automatic refetching, and loading states.

### Core Hooks

#### `useCurrentUser()`
Replaces all duplicate auth logic. Automatically redirects to `/auth` if not logged in.

```typescript
import { useCurrentUser } from '@/hooks/useCurrentUser';

const MyPage = () => {
  const { user, profile, loading, error, refetch } = useCurrentUser();
  
  if (loading) return <Loading />;
  if (!user) return null; // Redirect handled automatically
  
  return <div>Welcome {profile?.display_name}</div>;
};
```

#### `useProfile(userId)`
Get any user's profile with automatic caching.

```typescript
import { useProfile } from '@/hooks/useProfile';

const UserCard = ({ userId }) => {
  const { profile, loading, error } = useProfile(userId);
  
  if (loading) return <Loading />;
  if (!profile) return <div>User not found</div>;
  
  return <div>{profile.display_name}</div>;
};
```

#### `useBooking(bookingId)`
Get a single booking with related data.

```typescript
import { useBooking } from '@/hooks/useBooking';

const BookingDetail = ({ bookingId }) => {
  const { booking, loading, error, refetch } = useBooking(bookingId);
  
  if (loading) return <Loading />;
  if (!booking) return <div>Booking not found</div>;
  
  return <div>{booking.title}</div>;
};
```

#### `useBookings(userId)`
Get all bookings for a user with realtime subscriptions.

```typescript
import { useBookings } from '@/hooks/useBookings';

const BookingsPage = () => {
  const { user } = useCurrentUser();
  const {
    bookings,
    loading,
    createBooking,
    updateBooking,
    deleteBookingSecurely,
    rejectBooking,
    permanentlyDeleteBooking,
  } = useBookings(user?.id);
  
  // Bookings automatically update via realtime subscriptions
  return <BookingsList bookings={bookings} />;
};
```

#### `useConcepts(userId, includeDrafts?)`
Get all concepts for a user.

```typescript
import { useConcepts } from '@/hooks/useConcepts';

const ConceptsList = ({ userId }) => {
  const { concepts, loading, error, refetch } = useConcepts(userId, true);
  
  return <div>{concepts.map(c => <ConceptCard key={c.id} concept={c} />)}</div>;
};
```

### Mutation Hooks

#### `useBookingMutations`
```typescript
import {
  useCreateBooking,
  useUpdateBooking,
  useDeleteBooking,
  useRejectBooking,
  usePermanentlyDeleteBooking,
} from '@/hooks/useBookingMutations';

const BookingActions = ({ bookingId }) => {
  const { mutate: updateBooking } = useUpdateBooking();
  const { mutate: deleteBooking } = useDeleteBooking();
  
  const handleUpdate = () => {
    updateBooking({
      bookingId,
      updates: { title: 'New Title' },
    });
  };
  
  return <Button onClick={handleUpdate}>Update</Button>;
};
```

#### `useConceptMutations`
```typescript
import {
  useCreateConcept,
  useUpdateConcept,
  usePublishConcept,
  useDeleteConcept,
} from '@/hooks/useConceptMutations';

const ConceptActions = ({ conceptId }) => {
  const { mutate: publishConcept, isPending } = usePublishConcept();
  
  const handlePublish = () => {
    publishConcept(conceptId);
  };
  
  return <Button onClick={handlePublish} disabled={isPending}>
    {isPending ? 'Publishing...' : 'Publish'}
  </Button>;
};
```

---

## Error Handling

Centralized error handler in `src/lib/errorHandler.ts`.

### Functions

```typescript
import { handleError, showErrorToast, showSuccessToast } from '@/lib/errorHandler';

// Handle error and get user-friendly message
const message = handleError(error, 'context');

// Show error toast
showErrorToast(error, 'Error Title', 'context');

// Show success toast
showSuccessToast('Success!', 'Operation completed');
```

### Usage in Services

All services use the error handler internally:

```typescript
try {
  const { data, error } = await supabase.from('table').select('*');
  if (error) throw error;
  return data;
} catch (error) {
  logger.error('Error description', { error, context });
  throw error; // Re-throw for React Query to handle
}
```

---

## Best Practices

### 1. Use Services for All Database Operations

❌ **Don't** query Supabase directly in components:
```typescript
const { data } = await supabase.from('bookings').select('*');
```

✅ **Do** use services:
```typescript
const bookings = await bookingService.getUserBookings(userId);
```

### 2. Use React Query Hooks for Data Fetching

❌ **Don't** use useState/useEffect:
```typescript
const [bookings, setBookings] = useState([]);

useEffect(() => {
  const fetchBookings = async () => {
    const data = await supabase.from('bookings').select('*');
    setBookings(data);
  };
  fetchBookings();
}, []);
```

✅ **Do** use React Query hooks:
```typescript
const { bookings, loading } = useBookings(userId);
```

### 3. Use Error Handler for All Errors

❌ **Don't** use console.error or toast directly:
```typescript
catch (error) {
  console.error('Error:', error);
  toast({ title: 'Error', variant: 'destructive' });
}
```

✅ **Do** use error handler:
```typescript
catch (error) {
  showErrorToast(error, 'Operation Failed', 'context');
}
```

### 4. Use Logger Instead of console.log

❌ **Don't** use console.log:
```typescript
console.log('User created:', user);
```

✅ **Do** use logger:
```typescript
import { logger } from '@/utils/logger';

logger.business('User created', { userId: user.id });
logger.error('Error occurred', { error });
```

---

## Query Keys

All React Query hooks use centralized query keys from `src/lib/queryKeys.ts`:

```typescript
export const queryKeys = {
  profiles: {
    all: ['profiles'] as const,
    current: ['profiles', 'current'] as const,
    detail: (userId: string) => ['profiles', userId] as const,
  },
  bookings: {
    all: ['bookings'] as const,
    user: (userId: string) => ['bookings', 'user', userId] as const,
    detail: (bookingId: string) => ['bookings', bookingId] as const,
  },
  concepts: {
    all: ['concepts'] as const,
    user: (userId: string) => ['concepts', 'user', userId] as const,
    detail: (conceptId: string) => ['concepts', conceptId] as const,
  },
  events: {
    all: ['events'] as const,
    public: ['events', 'public'] as const,
    upcoming: (userId: string) => ['events', 'upcoming', userId] as const,
    completed: (userId: string) => ['events', 'completed', userId] as const,
  },
};
```

---

## Migration Guide

### Converting a Page to Use New Patterns

**Before:**
```typescript
const MyPage = () => {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('sender_id', user.id);
        
      setBookings(data);
      setLoading(false);
    };
    fetchData();
  }, []);
  
  // ... rest of component
};
```

**After:**
```typescript
const MyPage = () => {
  const { user } = useCurrentUser(); // Handles auth & redirect
  const { bookings, loading } = useBookings(user?.id); // Handles fetching
  
  if (loading) return <Loading />;
  
  // ... rest of component
};
```

---

## Benefits

### 1. **Less Code**
- Pages reduced from 100+ lines to 30-50 lines
- No duplicate auth logic
- No duplicate data fetching logic

### 2. **Better Performance**
- React Query caching reduces unnecessary API calls
- Automatic background refetching
- Optimistic updates

### 3. **Type Safety**
- All services use TypeScript types from Supabase
- Proper return types
- IDE autocomplete

### 4. **Easier Testing**
- Services can be mocked easily
- Hooks use React Query's testing utilities
- Clear separation of concerns

### 5. **Maintainability**
- Business logic centralized in services
- Consistent patterns across codebase
- Easy to find and update code

---

## File Structure

```
src/
├── services/           # Business logic & database operations
│   ├── profileService.ts
│   ├── bookingService.ts
│   ├── conceptService.ts
│   ├── eventService.ts
│   └── fileService.ts
├── hooks/             # React Query hooks
│   ├── useCurrentUser.ts
│   ├── useProfile.ts
│   ├── useBooking.ts
│   ├── useBookings.ts
│   ├── useBookingMutations.ts
│   ├── useConcepts.ts
│   ├── useConceptMutations.ts
│   └── ...
├── lib/               # Utilities
│   ├── errorHandler.ts
│   ├── queryKeys.ts
│   └── queryClient.ts
└── pages/             # Clean, focused page components
    └── ...
```

---

## Examples

### Example: Booking Creation Flow

```typescript
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCreateBooking } from '@/hooks/useBookingMutations';

const BookingRequestForm = () => {
  const { user } = useCurrentUser();
  const { mutate: createBooking, isPending } = useCreateBooking();
  
  const handleSubmit = (formData) => {
    createBooking({
      senderId: user.id,
      receiverId: artistId,
      title: formData.title,
      eventDate: formData.date,
      // ... other fields
    }, {
      onSuccess: (newBooking) => {
        // Navigate or show success message
        navigate(`/bookings/${newBooking.id}`);
      },
    });
  };
  
  return <BookingForm onSubmit={handleSubmit} isSubmitting={isPending} />;
};
```

### Example: Profile Display

```typescript
import { useProfile } from '@/hooks/useProfile';

const ArtistProfile = ({ artistId }) => {
  const { profile, loading, error } = useProfile(artistId);
  
  if (loading) return <Skeleton />;
  if (error) return <ErrorMessage />;
  if (!profile) return <NotFound />;
  
  return (
    <div>
      <h1>{profile.display_name}</h1>
      <p>{profile.bio}</p>
    </div>
  );
};
```

---

## Troubleshooting

### Query Not Updating After Mutation

Make sure mutations invalidate the correct queries:

```typescript
const { mutate } = useMutation({
  mutationFn: bookingService.update,
  onSuccess: () => {
    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(bookingId) });
  },
});
```

### useCurrentUser Not Redirecting

Ensure `useCurrentUser` is called at the component level, not inside useEffect:

❌ Wrong:
```typescript
useEffect(() => {
  const { user } = useCurrentUser(); // Breaks rules of hooks
}, []);
```

✅ Correct:
```typescript
const { user } = useCurrentUser(); // At component level
```

### Stale Data After Background Tab

React Query automatically refetches on window focus. Configure in `queryClient.ts`:

```typescript
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true,
    },
  },
});
```

---

## Next Steps

1. ✅ Service layer implemented
2. ✅ React Query hooks implemented
3. ✅ Error handling centralized
4. ✅ Pages refactored to use new patterns
5. 🔄 Remove remaining console.log statements
6. 🔄 Add comprehensive tests
7. 🔄 Performance monitoring
8. 🔄 Documentation updates

---

## Questions?

If you have questions about the refactoring or need to add new features:

1. **New database operation?** → Add to appropriate service
2. **New data fetching?** → Create React Query hook using service
3. **Error handling?** → Use `handleError` or `showErrorToast`
4. **Logging?** → Use `logger.business` or `logger.error`

---

**Last Updated:** 2024-11-29
