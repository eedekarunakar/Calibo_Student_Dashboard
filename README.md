# Calibo Student Dashboard

Next.js 14 App Router dashboard for student progress, assessments, module scores, analytics, and printable reports.

## Project Structure

```text
app/          App Router pages, protected routes, loading/error boundaries
components/   Shared navigation, forms, tables, and charts
lib/           Supabase browser, server, and admin clients
types/         Shared TypeScript database types
scripts/       CLI utilities, including Excel migration
```

## Environment Variables

Copy `.env.local.example` to `.env.local` and set:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

Keep `SUPABASE_SERVICE_ROLE_KEY` private. It is used only by the server-side migration client.

## Development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Build for production with `npm run build`, then run it with `npm start`.

## Excel Migration

The migration expects an Excel workbook with `Student Master`, `Assessment Data`, and `Diagnostic` sheets. Run it with:

```bash
npm run migrate -- path/to/students.xlsx
```

The script reads the workbook with `xlsx`, writes through the Supabase service-role client, processes rows in batches of 200, and reports progress and final row counts. Computed view columns are intentionally skipped.