# Reports are private and never shared across users

Stack Entries and Free-text Topics may include commercially sensitive work-related technologies (e.g., internal Azure and Microsoft Fabric configurations). Sharing Reports across users — or surfacing them publicly — would risk confidential information about an employer's technology choices reaching unintended recipients. Reports are scoped strictly to the authenticated user who triggered the Research Run. The data model does not implement multi-tenancy even though the Google OAuth layer could support multiple users; this is deliberate, not an oversight.

## Consequences

Free-text Topic fields carry a UI-level warning: topic strings are sent to third-party APIs (Tavily, Anthropic) and should contain only public technology names, never proprietary system names, internal endpoints, or project codenames.
