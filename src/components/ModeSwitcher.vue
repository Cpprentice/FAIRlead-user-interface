<template>
    <div class="d-flex flex-column align-center pa-6" v-if="show">
        <v-btn-toggle
            v-model="toggle"
            color="teal-darken-2"
            mandatory
            @update:model-value="navigate"
        >
            <v-btn icon="mdi-graph" value="schema"></v-btn>
            <v-btn icon="mdi-filter" value="filtered-schema"></v-btn>
            <v-btn icon="mdi-chart-box-multiple" value="partitioned-schema"></v-btn>
        </v-btn-toggle>
    </div>
    <!-- <div>
        <v-btn icon><v-icon>mdi-plus</v-icon></v-btn>
        <v-btn icon><v-icon>mdi-dots-vertical</v-icon></v-btn>
    </div> -->
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';


const route = useRoute();
const router = useRouter();

const toggle = ref('schema');

function checkRoute() {
    toggle.value = route.name
}

const show = computed(() => route.name != 'not-found')

function navigate(newChoice) {
    router.push({...route, name: newChoice})
}

watch(() => route.fullPath, (newPath, oldPath) => {
    checkRoute()
})

// watch(() => route.name, async (newRouteName, oldRouteName) => {
//     await performApiFetch(route.params.schemaId, newRouteName == 'partitioned-schema')
// })

// watch(() => route.params.schemaId, async (newSchema, oldSchema) => {
//     await performApiFetch(newSchema, route.name == 'partitioned-schema')
// })

onMounted(() => {
    checkRoute()
})
</script>

<style scoped>
</style>
