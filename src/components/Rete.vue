<template>
    <v-container fluid style="margin-top: 64px;">
      <main class="rete" ref="editorContainer"></main>
    </v-container>
</template>


<script lang="ts" setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { createEditor } from '../rete/fairlead';
import { Entity, EntityApi, FetchError } from 'schema_api';
import { cachedEntityProvider } from '../providers/schema_api';
import { loadingState } from '../providers/loading_state_provider';

const editorContainer = ref(null);

const route = useRoute();
const editor = ref(null);

watch(() => cachedEntityProvider.entities, async (newEntities, oldEntities) => {
    await editorSetup(newEntities);
    loadingState.value = false
},  { deep: true })

async function editorSetup(entities: Entity[]) {
  if (editor.value != null) {
    editor.value.destroy();
  }
  editor.value = await createEditor(editorContainer.value, route.params.schemaId, entities);
}
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
