# FAIRlead-user-interface

This repository contains the user interface for the FAIRlead project.
It is intended to visualize extracted conceptual models, allow for user enhancements and to perform a visual mapping between the conceptual models of provided data sources and an ontological output model.

The mapping is achieved with a flow based programming approach.

The implementation uses Vue JS 3 and the rete.js flow based programming library as well as vuetify for UI components.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/)
[Node 22](https://nodejs.org)

## Project Setup

Make sure that the [FAIRlead-model-extraction](https://github.com/Cpprentice/FAIRlead-model-extraction) API is running on Port 7373 to use the UI.

```sh
pnpm install --frozen-lockfile
```

### Compile and Hot-Reload for Development

```sh
pnpm run dev
```

### Type-Check, Compile and Minify for Production

```sh
pnpm run build
```
