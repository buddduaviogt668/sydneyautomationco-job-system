# Website Leads Integration

The job system now includes a **Website Leads** inbox at `/website-leads`. The SAC website posts qualified five-path enquiries to the job-system Vercel API, where they are stored in a shared Postgres database and can be marked New, Contacted, Quoted, Converted or Lost. A lead can be converted into the existing local job and client records from the inbox.

## Job-system Vercel variables

Configure these variables on the job-system Vercel project:

```text
POSTGRES_URL=<Vercel Postgres or Neon connection string>
LEAD_INGEST_TOKEN=<long random token used only by the SAC website proxy>
LEAD_ADMIN_TOKEN=<long random token used by the Website Leads page>
```

The API creates the `website_leads` table automatically on its first request. The Website Leads page stores the admin token only in the current browser’s local storage; it is not committed to the repository.

## SAC website Vercel variables

Configure these variables on the SAC website Vercel project:

```text
JOB_SYSTEM_URL=https://<job-system-domain>
JOB_SYSTEM_INGEST_TOKEN=<same value as the job-system LEAD_INGEST_TOKEN>
LEAD_TO_EMAIL=service@sydneyautomationco.com.au
```

The SAC endpoint first attempts to create a lead in the job system. If the integration variables are absent or the job system is unavailable, it falls back to the configured email relay path. The visitor-facing form remains unchanged.

## Lead fields

The website sends path, name, phone, email, location, preferred contact, message, source page and a submission identifier. The job system stores the submission identifier to prevent duplicate records when a visitor retries or a network request is repeated.

## Deployment order

1. Deploy the job-system project with the database and token variables.
2. Open `/website-leads` and enter the `LEAD_ADMIN_TOKEN` once.
3. Configure `JOB_SYSTEM_URL` and `JOB_SYSTEM_INGEST_TOKEN` on the SAC project.
4. Deploy SAC and submit a controlled test enquiry.
5. Confirm the lead appears in Website Leads before using the conversion action.
