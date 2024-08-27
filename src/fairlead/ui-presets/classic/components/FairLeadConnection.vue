<template lang="pug">
svg(data-testid="connection")
    path(:d="path")
</template>
    
<script>
import { defineComponent } from 'vue'

export default defineComponent({
    props: ['data', 'start', 'end', 'path']
})
</script>

<style lang="scss" scoped>
svg {
    overflow: visible !important;
    position: absolute;
    pointer-events: none;
    width: 9999px;
    height: 9999px;
    path {
        fill: none;
        stroke-width: 5px;
        stroke: steelblue;
        pointer-events: auto;
    }
}
</style>
