# Server Actions for config mutations, REST only for the polled run job

The Research Configuration surface (Stack Entry, Free-text Topic, Source, and Category CRUD) mutates via Next.js Server Actions, guarded by an auth check at the top of each action, with reads served by Server Components querying the repository directly and freshness handled by `revalidatePath`. We deliberately keep the existing `/api/research-runs` REST route as the one exception: it enqueues a Trigger.dev job and is *polled* by the client for status, which a fetchable route serves better than an action. This gives the app two mutation patterns on purpose — a future reader seeing both should not "unify" them.

## Consequences

- Testing seam #4 in the PRD ("all API routes return 401 without a valid session") no longer covers the config layer. The same intent — unauthenticated mutations are refused — is verified by invoking a Server Action without a session and asserting it rejects. The seam wording should be updated to reflect the two mechanisms.
