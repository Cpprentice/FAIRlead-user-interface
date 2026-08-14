<template>
    <v-app-bar color="teal-darken-4" elevate absolute>
        <template v-slot:prepend>
            <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
        </template>
        <v-app-bar-title>FAIRlead ER view</v-app-bar-title>
        <v-spacer></v-spacer>
        <!--<TestDialog></TestDialog>-->
        <PartitionSelector></PartitionSelector>
        <EntityFilter v-if="isLegacy"></EntityFilter>
        <ClassFilter v-if="!isLegacy"></ClassFilter>
        <!-- <v-btn icon><v-icon>mdi-plus</v-icon></v-btn> -->
        <ModeSwitcher></ModeSwitcher>
        <DownloadControls></DownloadControls>
        <v-divider vertical thickness="3" length="48" class="mx-3 align-self-center"></v-divider>
        <v-btn icon href="http://localhost:7373/docs" target="_blank"><v-icon>mdi-book-open-page-variant</v-icon></v-btn>
        <v-btn icon @click.stop="settingsDrawer = !settingsDrawer"><v-icon>mdi-dots-vertical</v-icon></v-btn>
    </v-app-bar>
    <v-navigation-drawer
      v-model="drawer"
      temporary
      absolute
      class="rete-nav-drawer"
    >
      <v-list
        nav
        dense
        
      ><!--@update:selected="selected"-->
          <v-list-item title="LinkML" subtitle="section"></v-list-item>
          <v-list-item v-for="schema in schemaChoices" router :to="`/schemas/${schema}/linkml`">
            <v-list-item-title>{{ schema }}</v-list-item-title>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item title="LinkML Filtered" subtitle="section"></v-list-item>
          <v-list-item v-for="schema in schemaChoices" router :to="`/schemas/${schema}/linkml/filtered`">
            <v-list-item-title>{{ schema }}</v-list-item-title>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item title="Mappings" subtitle="section"></v-list-item>
          <v-list-item router to="/mappings/new">
            <v-list-item-title><v-icon>mdi-plus</v-icon> New</v-list-item-title>
          </v-list-item>
          <!--<v-list-item router to="/mappings/blub" title="Test"></v-list-item>-->
          <v-divider></v-divider>
          <v-list-item title="ER Diagrams" subtitle="section"></v-list-item>
          <!--<v-divider></v-divider>-->
          <v-list-item v-for="schema in schemaChoices" router :to="`/schemas/${schema}`">
            <v-list-item-title>{{ schema }}</v-list-item-title>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item title="Annotation" subtitle="section"></v-list-item>
          <v-list-item v-for="schema in schemaChoices" router :to="`/schemas/${schema}/annotation`">
            <v-list-item-title>{{ schema }}</v-list-item-title>
          </v-list-item>

      </v-list>
    </v-navigation-drawer>
    <v-navigation-drawer
        v-model="settingsDrawer"
        absolute
        location="right"
        temporary
        class="rete-nav-drawer"
    >
        <ApiSettingsSelector></ApiSettingsSelector>
    </v-navigation-drawer>
    <v-alert v-if="errorMessage" class="error-box" prominent border="bottom" color="red" elevation="9" type="error">{{ errorMessage }}</v-alert>
    <v-alert v-if="noSchemaSelectedMessage" class="error-box" prominent border="bottom" color="green" elevation="9">{{ noSchemaSelectedMessage }}</v-alert>
    <v-progress-circular class="loading-wheel" color="teal-darken-4" indeterminate :size="128" :width="12" v-if="loadingState"></v-progress-circular>
</template>

<script setup lang="ts">
import { cachedClassProvider, cachedEntityProvider, cachedMappingProvider } from '@/providers/schema_api';
import { FetchError, SchemaApi } from 'schema_api';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import EntityFilter from './EntityFilter.vue';
import ClassFilter from './ClassFilter.vue';
import ModeSwitcher from './ModeSwitcher.vue';
import PartitionSelector from './PartitionSelector.vue';
import { loadingState } from '@/providers/loading_state_provider';
import ApiSettingsSelector from './ApiSettingsSelector.vue';
import { importExportProvider } from '@/providers/import_export_provider';
import TestDialog from './TestDialog.vue';
import DownloadControls from './DownloadControls.vue';


const schemaChoices = ref([]);
const drawer = ref(false);
const settingsDrawer = ref(false);
const errorMessage = ref('');
const noSchemaSelectedMessage = ref('')

const route = useRoute();

const isLegacy = computed(() => {
    return ['schema', 'filtered-schema', 'partitioned-schema'].includes(route.name?.toString() || 'not-found')
})

async function performExport() {
    let jsonString = await importExportProvider.performExport();
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = 'model_export.json'
    link.click();

    URL.revokeObjectURL(url);
}

async function downloadLinkML() {
    const api = new SchemaApi();

    const response = await api.getClassesBySchemaRaw({schemaId: route.params.schemaId as string}, {headers: {
        "Accept": "application/x.linkml+yaml"
    }});

    let content;

    // const blob = new Blob([content], { type: "application/x-yaml" });
    const blob = await response.raw.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${route.params.schemaId}-linkml.yaml`
    link.click();

    URL.revokeObjectURL(url);
}

async function performApiFetch() {

    if (route.name == 'not-found') {
        noSchemaSelectedMessage.value = 'Please select a schema'
    } else {
        noSchemaSelectedMessage.value = ''
        loadingState.value = true
    }

    errorMessage.value = ''
    if (route.name == 'schema') {
        try {
            await cachedEntityProvider.fetchEntities(route.params.schemaId);
        } catch (ex) {
            if (ex instanceof FetchError) {
                errorMessage.value = 'Could not fetch entities for schema'
                loadingState.value = false
            } else {
                throw ex;
            }
        }
    } else if (route.name == 'mapping') {
        if (route.params.mappingId == 'new') {
            cachedMappingProvider.clearMapping();
        } else {
            try {
                await cachedMappingProvider.fetchMapping(route.params.mappingId);
            } catch (ex) {
                if (ex instanceof FetchError) {
                    errorMessage.value = 'Could not fetch mapping object'
                    loadingState.value = false;
                } else {
                    throw ex;
                }
            }
        }
    } else if (["schema-annotation", "linkml-schema"].includes(route.name?.toString() || '')) {
        try {
            await cachedClassProvider.value.fetchClasses(route.params.schemaId);
            // cachedClassProvider.value.fetchClassesDebounced(route.params.schemaId);
        } catch (ex) {
            if (ex instanceof FetchError) {
                errorMessage.value = 'Could not fetch classes for schema'
                loadingState.value = false
            } else {
                throw ex;
            }
        }
    } else if (route.name == 'filtered-linkml-schema') {
        try {
            await cachedClassProvider.value.fetchFilteredClasses(route.params.schemaId, []);
            // cachedClassProvider.value.fetchClassesDebounced(route.params.schemaId);
        } catch (ex) {
            if (ex instanceof FetchError) {
                errorMessage.value = 'Could not fetch classes for schema'
                loadingState.value = false
            } else {
                throw ex;
            }
        }
    }
}

watch(() => route.fullPath, async (newPath, oldPath) => {
    await performApiFetch()
}, {immediate: true})

// watch(() => route.name, async (newRouteName, oldRouteName) => {
//     await performApiFetch(route.params.schemaId, newRouteName == 'partitioned-schema')
// })

// watch(() => route.params.schemaId, async (newSchema, oldSchema) => {
//     await performApiFetch(newSchema, route.name == 'partitioned-schema')
// })

onMounted(async () => {
    const api = new SchemaApi();
    try {
        schemaChoices.value = (await api.getAllSchemas()).map((x) => x.id) ?? [];
    } catch (ex) {
        if (ex instanceof FetchError) {
            schemaChoices.value = [];
            errorMessage.value = "Failed to fetch list of schemas"
        } else {
            throw ex;
        }
    }

    // await performApiFetch()
})
</script>

<style scoped>

.error-box {
  position: fixed;
  top: calc(50% + 32px);
  /* top: 50%; */
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000; /* Ensure it is on top of other content */
  width: 80%; /* Adjust width as needed */
  max-width: 400px; /* Adjust max-width as needed */
}

.loading-wheel {
  position: fixed;
  top: calc(50% + 32px);
  /* top: 50%; */
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000; /* Ensure it is on top of other content */
}

.rete-nav-drawer {
  height: calc(100vh - 64px)!important;
  top: 64px!important;
}

</style>
