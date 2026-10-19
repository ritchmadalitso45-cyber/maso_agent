# Maso frontend

React chat interface connected to the sibling Maso Safety API.

## Run locally

1. In `C:\Projects\Maso`, run `start.cmd` (default port 8000).
2. In `C:\Projects\MasoFront`, run `npm install` if needed, then `npm run dev`.
3. Open the local address printed by Vite, normally http://127.0.0.1:5173.

Messages are sent to `/api/v1/analyze`. Vite forwards requests to Maso and supplies the API key on the server. The key is read from the sibling `../Maso/.env`; it is never included in the browser bundle. Restart Vite after changing the key.

To use a different backend, set `MASO_API_TARGET` (for example `http://127.0.0.1:8001`) and, if needed, `MASO_API_KEY` in the process environment or an ignored `.env.local`. Never use a `VITE_` variable for secrets.

The interface displays the API verdict, model phishing confidence, findings, recommended steps, check statuses and limitations. Link expansion and external provider checks remain off. Verdicts come exclusively from the local model. Failures show an error with no rule-based fallback.

## Verify and deploy

Run `npm run lint` and `npm run build`. `npm run preview` includes the same local proxy for checking the production build.

For deployment, configure a trusted server or authenticated gateway to forward `/api` to Maso and supply its API key. A static file host alone cannot provide this server-side proxy. Do not expose the local Vite development/preview servers as a public production gateway.


## Attachments

Use the attachment button to choose an `.eml` email or a PNG/JPEG/WebP image containing a QR code (up to 2 MiB). The selected filename appears above the input; press Send to upload, or remove it with the cross button. Any typed message stays as a separate draft and is not included with the file. Only one check runs at a time. Empty files and unsupported formats are rejected locally; the API validates the actual email/image content. Images are scanned for QR codes, not general screenshot text or image content. No link destinations are contacted by these requests.

Upload-request checks: `node --test tests/analysisRequest.test.js`.
