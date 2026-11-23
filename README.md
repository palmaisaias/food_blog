# The Tuesday Table

One recipe. Three kitchens. Every week. A cooking journal built with the Next.js App Router, TypeScript, Tailwind CSS, Motion, and Supabase.

## Run locally

Use Node.js 24 LTS and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). With both Supabase variables empty, the site runs as a read-only sample journal. The three sample recipes use generated illustrations as cover photography. The kitchen entries are empty so the demo shows how the journal looks before friends submit their own photos. The sample recipes are loaded from the app and are never inserted into the database. A configured Supabase project starts with an empty journal.

## Configure Supabase

1. Create a Supabase project. Copy its project URL and **publishable** key into `.env.local`. Set `SITE_URL` to the origin you use in the browser. A service-role key is unnecessary.
2. Apply [the migration](supabase/migrations/20261122000000_tuesday_table.sql) through the SQL Editor, or install the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) and run the following from this directory.

   ```sh
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```

3. Under **Authentication → Users**, create an email/password user for the owner and confirm their email. Copy the user UUID. In the SQL Editor, grant that UUID access.

   ```sql
   insert into public.administrators (user_id)
   values ('REPLACE_WITH_AUTH_USER_UUID');
   ```

4. Disable public sign-ups in the project's Authentication settings. Set its Site URL to your final deployment origin. Restart the Next.js dev server after changing `.env.local`.
5. Open [http://localhost:3000/admin](http://localhost:3000/admin) and sign in.

For a local Supabase stack, install the CLI and start Docker, then run `supabase start` in this directory. Use the URL and publishable key from `supabase status`, and create and authorize the owner via the local Studio.

The migration creates the normalized recipe and photo journal tables, participant identities, row-level security policies, a private photo bucket, and a transactional recipe save function. Public requests use an anonymous client. Owner-only requests use Supabase Auth cookies and check the database allowlist. Public image URLs resolve only while a published recipe references the object. To revoke editing access, remove the corresponding allowlist row.

## Use the owner’s desk

- Choose **New recipe**. Fill in **Recipe details**, **Ingredients**, and **Method**. A draft needs a title and a unique recipe link. Publishing and scheduling also require an introduction, a cover photo, ingredients, instructions, and descriptions for uploaded images.
- In **Publication**, save a draft, publish immediately, or choose a future Tuesday. A scheduled recipe becomes public at midnight in `America/Los_Angeles`, including daylight saving changes. The site checks publication times as it serves pages and needs no cron job. Immediate publication is available any day. The homepage uses the latest publication timestamp. Saving edits to a live recipe preserves its publication date.
- Return to an entry any time to add cook dates, comments, and photos under **Kitchen journal**. Use the photo and step controls to reorder items. Supported uploads are JPG, PNG, WebP, and AVIF. The editor compresses large files locally, and the server validates, resizes, and stores them as WebP. Photo files are uploaded as soon as they are selected. Save the recipe to attach them to an entry.
- Replacing or removing a saved photo detaches it and attempts to remove its file. Abandoned uploads and cleanup failures can leave private, unreferenced files. If you need to reclaim that storage, compare bucket paths against `recipe_images.object_path` and `submission_photographs.object_path` and remove unreferenced objects from Supabase Storage while the editor is idle.
- **Delete recipe** deliberately removes the recipe from the journal and archive. Changing a live recipe to **Draft** hides it and its photos while retaining the content for further edits. Back up both PostgreSQL and the Storage bucket to preserve your journal.

## Deploy to Vercel

Import the Git repository into Vercel as a Next.js app, or link this directory with `npx vercel`. Set the project’s Node.js version to 24.x. Apply the Supabase migration before deploying. Set the three variables from [.env.example](.env.example) in the Vercel project and redeploy. Use the final HTTPS origin for `SITE_URL` so canonical recipe URLs and Open Graph photos work in messaging apps. Enable the production Auth Site URL in Supabase.

## Checks

```sh
npm run lint
npm run typecheck
npm run build
```
