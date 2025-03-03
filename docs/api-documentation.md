---
hide:
  - navigation
  - toc
  - title
---
<!--# ER Extraction API-->
<style>
  .md-typeset h1,
  .md-content__button {
    display: none;
  }
</style>

<div id="swagger-ui"></div>
<script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script>
    const ui = SwaggerUIBundle({
        url: '../assets/openapi3_1_merged.yaml',
        dom_id: "#swagger-ui",
        layout: "BaseLayout",
        deepLinking: true,
        showExtensions: true,
        showCommonExtensions: true,
        presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
    });
</script>