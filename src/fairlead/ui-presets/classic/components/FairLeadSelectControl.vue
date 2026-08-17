<template lang="pug">
v-select(
    density="compact"
    variant="outlined"
    v-model="data.value"
    :readonly="data.readonly"
    @pointerdown.stop=""
    @update:modelValue="change"
    item-title="label"
    return-object=true
    clearable=true
    hide-details=true
    :items="items"
)
    //:items="data.selectables"
    //@input="change"
    //:selected="data.value"

    //option(:selected="data.value === undefined")
    //option(v-for='x in data.selectables' :selected="x.name === data.value?.name" :value="x") {{ x.name }}
</template>

<script>
import { useNotifications } from '@/providers/notifications';
import { FetchError } from 'schema_api';
import { defineComponent } from 'vue'

export default defineComponent({
    props: ['data'],
    setup() {
        const { trackPromise } = useNotifications();
        return {
            trackPromise
        }
    },
    methods: {
        change(e) {
            // let value = undefined;
            // if (e.target.selectedIndex > 0) value =  this.data.selectables[e.target.selectedIndex - 1];
            // this.data.setValue(value)
            this.data.setValue(e)
        },
        async load() {
            this.items = await this.trackPromise("fetching options", this.data.provider.fetchSelectionOptions())
            // try {
            //     this.items = await this.data.provider.fetchSelectionOptions()
            // } catch (error) {
            //     const message = error instanceof FetchError ? error.message : String(error);
            //     this.addError(message)
            // }
        }
    },
    mounted() {
        this.load()
    },
    data() {
        return {
            items: []
        }
    },
    // computed: {
    //     items() {
    //         return [undefined, ...this.data.selectables]
    //     }
    // }
})
</script>

<style lang="scss" scoped>
@use "sass:math";
@import "../vars";

// select {
//     width: 100%;
//     border-radius: 5px;
//     background-color: white;
//     padding: 2px 6px;
//     border: 1px solid #999;
//     font-size: 110%;
//     box-sizing: border-box;
// }
</style>
