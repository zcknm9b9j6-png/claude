# Static assets

Files in this folder are served from the site root, unchanged.

## Logo

The header logo is **`public/logo.svg`** — a vector recreation of the Fair Play
OOSH wordmark. Being vector, it stays sharp at any size.

### Want to use the exact original logo instead?

Drop a raster image named **`logo.png`** in this folder:

```
public/logo.png
```

The header checks for `logo.png` **first**, so it will automatically override
`logo.svg` with no code change. (Easiest way to add it: upload via github.com in
a browser — the GitHub mobile *app* can't upload images.)

If neither file is present, the header falls back to a "FAIR PLAY OOSH" text
wordmark.
