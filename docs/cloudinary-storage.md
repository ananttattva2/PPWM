# Cloudinary file storage

Set `CLOUDINARY_URL` in the server environment using the existing Cloudinary account connection string. Local development reads `.env.local`; deployments must set the same variable in their hosting environment. Never use a `NEXT_PUBLIC_` variable or commit the connection string. When the variable is absent outside production, uploads use the ignored `.local/uploads` directory so the application remains usable during local development. Production still requires Cloudinary and fails closed when it is not configured.

New product/component photos, imported spreadsheets, client documents, profile pictures, packaging-detail attachments and assessment evidence use Cloudinary. MongoDB retains file metadata, access context and Cloudinary references. Previously saved MongoDB binary files continue to download through the same protected application URLs; this change does not migrate or delete them.

Uploads use Cloudinary's authenticated delivery type. Downloads go through existing access checks before the server fetches a short-lived signed download URL. Secrets and signed URLs are not returned to the browser. No unsigned upload preset is required.

The common upload service supports PNG/JPEG/WebP/GIF, PDF, XLS/XLSX/CSV, DOC/DOCX/TXT, MP4/WebM/MOV. Existing form-specific limits still apply. General uploads allow up to 50 MB; server-side signature checks reject content that does not match its declared type. Product-photo fields remain image-only.

Cloudinary upload errors are surfaced to the user; there is no automatic fallback to storing new file binaries in MongoDB. The local-development filesystem fallback is not used when Cloudinary is configured and is never enabled in production. Record deletion and retention policies must also account for externally stored objects; MongoDB TTL alone does not delete Cloudinary assets or local development files.

References: [Cloudinary upload documentation](https://cloudinary.com/documentation/upload_images), [authenticated media access](https://cloudinary.com/documentation/control_access_to_media).
