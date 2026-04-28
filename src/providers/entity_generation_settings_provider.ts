import { reactive } from "vue";

interface EntityGenerationSettings
{
    preventOptimization?: boolean;
    preventAutomaticOptimization?: boolean;
    preventUserOptimization?: boolean;
    generateInverseRelations?: boolean;
    preventEnhancement?: boolean;
    preventStructuralEnhancement?: boolean;
}

const entityGenerationSettings = reactive({
    preventOptimization: false,
    preventAutomaticOptimization: false,
    preventUserOptimization: false,
    generateInverseRelations: false,
    preventStructuralEnhancement: false,
    preventEnhancement: false
} as EntityGenerationSettings);

export {entityGenerationSettings}
