import { ClassDefinitionView, SlotDefinitionView } from "schema_api";
import { ref } from "vue";

const attributeUnderAnnotation = ref<SlotDefinitionView | null>(null);
const classUnderAnnotation = ref<ClassDefinitionView | null>(null);

export {attributeUnderAnnotation, classUnderAnnotation}

