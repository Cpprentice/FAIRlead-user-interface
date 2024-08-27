<template lang="pug">
div()
    input(
        ref="inputRef"
        type="file"
        style="display: none;"
        :value="data.value"
        @input="change"
        @pointerdown.stop=""
    )
    v-btn(
        @click="selectFile"
        @pointerdown.stop=""
    ) Select
</template>
    
<script>
import { defineComponent, ref } from 'vue'

export default defineComponent({
    props: ['data'],
    methods: {
        change(e) {
            this.data.setValue(e.target.files[0])
        },
        selectFile() {
            const event = new MouseEvent('click', {
                'view': window,
                'bubbles': true,
                'cancelable': true
            });
            this.inputRef.dispatchEvent(event)
        }
    },
    setup() {
        const inputRef = ref(null)
        return {inputRef}
    }
})
</script>
    
<style lang="scss" scoped>
@use "sass:math";
@import "../vars";

input {
    width: 100%;
    border-radius: 30px;
    background-color: white;
    padding: 2px 6px;
    border: 1px solid #999;
    font-size: 110%;
    box-sizing: border-box;
}
</style>