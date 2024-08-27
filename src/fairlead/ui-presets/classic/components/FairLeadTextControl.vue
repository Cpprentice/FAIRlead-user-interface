<template lang="pug">
v-text-field(
    density="compact"
    variant="outlined"
    hide-details="auto"
    :type="data.type"
    :readonly="data.readonly"
    :model-value="text"
    @pointerdown.stop=""
    @update:modelValue="change"
)
//:value="data.value"
//@input="change"
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
    props: ['data'],
    methods: {
        change(e) {
            // this.data.setValue(e.target.value)
            this.data.setValue(e)
        }
    },
    data() {
        console.log('TextControlComponent data() is called')
        return {
            text: this.data.value
        }
    }
})
</script>

<style lang="scss" scoped>
@use "sass:math";
@import "../vars";

input {
    width: 100%;
    border-radius: 5px;
    background-color: white;
    padding: 2px 6px;
    border: 1px solid #999;
    font-size: 110%;
    box-sizing: border-box;
}
</style>
