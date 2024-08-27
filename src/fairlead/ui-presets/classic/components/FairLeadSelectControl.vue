<template lang="pug">
v-select(
    density="compact"
    variant="outlined"
    v-model="data.value"
    :readonly="data.readonly"
    @pointerdown.stop=""
    @update:modelValue="change"
    :items="data.selectables"
    item-title="name"
    return-object=true
    clearable=true
    hide-details=true
)
    //@input="change"
    //:selected="data.value"

    //option(:selected="data.value === undefined")
    //option(v-for='x in data.selectables' :selected="x.name === data.value?.name" :value="x") {{ x.name }}
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
    props: ['data'],
    methods: {
        change(e) {
            // let value = undefined;
            // if (e.target.selectedIndex > 0) value =  this.data.selectables[e.target.selectedIndex - 1];
            // this.data.setValue(value)
            this.data.setValue(e)
        }
    },
    computed: {
        items() {
            return [undefined, ...this.data.selectables]
        }
    }
})
</script>

<style lang="scss" scoped>
@use "sass:math";
@import "../vars";

select {
    width: 100%;
    border-radius: 5px;
    background-color: white;
    padding: 2px 6px;
    border: 1px solid #999;
    font-size: 110%;
    box-sizing: border-box;
}
</style>
