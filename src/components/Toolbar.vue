<template>
    <v-app-bar color="teal-darken-4" elevate>
        <template v-slot:prepend>
            <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
        </template>
        <v-app-bar-title>FAIRlead ER view</v-app-bar-title>
        <v-spacer></v-spacer>
        <PartitionSelector></PartitionSelector>
        <EntityFilter></EntityFilter>
        <!-- <v-btn icon><v-icon>mdi-plus</v-icon></v-btn> -->
        <ModeSwitcher></ModeSwitcher>
        <v-btn icon href="http://localhost:7373/docs" target="_blank"><v-icon>mdi-book-open-page-variant</v-icon></v-btn>
        <v-btn icon @click.stop="settingsDrawer = !settingsDrawer"><v-icon>mdi-dots-vertical</v-icon></v-btn>
    </v-app-bar>
    <v-navigation-drawer
      v-model="drawer"
      absolute
      bottom
      temporary
    >
      <v-list
        nav
        dense
        
      ><!--@update:selected="selected"-->

          <v-list-item v-for="schema in schemaChoices" router :to="`/schemas/${schema}`">
            <v-list-item-title>{{ schema }}</v-list-item-title>
          </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-navigation-drawer
        v-model="settingsDrawer"
        absolute
        location="right"
        bottom
        tempoary
    >
        <ApiSettingsSelector></ApiSettingsSelector>
    </v-navigation-drawer>
    <v-alert v-if="errorMessage" class="error-box" prominent border="bottom" color="red" elevation="9" type="error">{{ errorMessage }}</v-alert>
    <v-alert v-if="noSchemaSelectedMessage" class="error-box" prominent border="bottom" color="green" elevation="9">{{ noSchemaSelectedMessage }}</v-alert>
    <v-progress-circular class="loading-wheel" color="teal-darken-4" indeterminate :size="128" :width="12" v-if="loadingState"></v-progress-circular>
</template>

<script setup lang="ts">
import { cachedEntityProvider } from '@/providers/schema_api';
import { FetchError, SchemaApi } from 'schema_api';
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import EntityFilter from './EntityFilter.vue';
import ModeSwitcher from './ModeSwitcher.vue';
import PartitionSelector from './PartitionSelector.vue';
import { loadingState } from '@/providers/loading_state_provider';
import ApiSettingsSelector from './ApiSettingsSelector.vue';


const schemaChoices = ref([]);
const drawer = ref(false);
const settingsDrawer = ref(false);
const errorMessage = ref('');
const noSchemaSelectedMessage = ref('')

const route = useRoute();

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
    }
}

watch(() => route.fullPath, async (newPath, oldPath) => {
    await performApiFetch()
})

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

    await performApiFetch()
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

</style>
