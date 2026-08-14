<template>
    <v-container fluid style="margin-top: 64px;">
      <main class="rete" ref="editorContainer"></main>
    </v-container>
    <v-alert v-if="errorMessage" class="error-box" prominent border="bottom" color="red" elevation="9" type="error">{{ errorMessage }}</v-alert>
</template>


<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { createEditor } from '../rete/fairleadMapping';
import { Entity, EntityApi, FetchError } from 'schema_api';
import { cachedMappingProvider } from '../providers/schema_api';
import { loadingState } from '../providers/loading_state_provider';

const editorContainer = ref(null);

const route = useRoute();
const editor = ref(null);
const errorMessage = ref<string>('');

watch(() => cachedMappingProvider.mapping, async (newMapping, oldMapping) => {
    await editorSetup(newMapping);
},  { deep: true })

async function editorSetup(mapping: string[]) {
  if (editor.value != null) {
    editor.value.destroy();
  }
  editor.value = await createEditor(editorContainer.value, route.params.mappingId, mapping);
  errorMessage.value = '';
  loadingState.value = false
}

onMounted(async () => {
  if (cachedMappingProvider.mapping == null) {
    errorMessage.value = 'Mapping not initialized'
  }
  else {
    await editorSetup(cachedMappingProvider.mapping);
  }
})
</script>

<style scoped>
.rete {
  position: relative;
  height: calc(100vh - 64px - 32px);
  font-size: 1rem;
  background: white;
  border-radius: 1em;
  text-align: left;
  border: 3px solid #55b881;
  line-height: 1;
}
</style>
