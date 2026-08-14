<template>
    <v-container fluid style="margin-top: 64px;">
      <main class="rete" ref="editorContainer"></main>
    </v-container>
</template>


<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { createEditor } from '../rete/fairleadMapping';
import { Entity, EntityApi, FetchError } from 'schema_api';
import { cachedMappingProvider } from '../providers/schema_api';
import { loadingState } from '../providers/loading_state_provider';
import { useNotifications } from '@/providers/notifications';

const editorContainer = ref(null);

const route = useRoute();
const editor = ref(null);
const { addError } = useNotifications();

watch(() => cachedMappingProvider.mapping, async (newMapping, oldMapping) => {
    await editorSetup(newMapping);
},  { deep: true })

async function editorSetup(mapping: string[]) {
  if (editor.value != null) {
    editor.value.destroy();
  }
  if (mapping == null) {
    addError('Mappings not initialized yet')
  } else if (editorContainer == null) {
    addError('Main panel not mounted yet')
  } else {
    editor.value = await createEditor(editorContainer.value, route.params.mappingId, mapping);
  }
  loadingState.value = false
}

onMounted(async () => {
  await editorSetup(cachedMappingProvider.mapping);
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
